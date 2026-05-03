import base64
import io
import json
import os
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DATA_PATH = Path(os.environ.get("KINDGESUND_DATA", "/data/diary.json"))
CONFIG_PATH = Path(os.environ.get("KINDGESUND_CONFIG", "/data/options.json"))
STATIC_DIR = Path(__file__).parent / "static"
UPLOAD_DIR = DATA_PATH.parent / "uploads"

app = FastAPI(title="Gesundheitstracker", version="1.7.3")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_config() -> Dict[str, Any]:
    defaults = {
        "app_title": "Gesundheitstracker",
        "child_name": "Kind",
        "fever_threshold": 38.5,
        "high_fever_threshold": 39.5,
        "dark_mode": False,
        "pin_enabled": False,
        "pin_code": "",
    }
    if CONFIG_PATH.exists():
        try:
            data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                defaults.update(data)
        except Exception:
            pass
    return defaults


def default_store() -> Dict[str, Any]:
    return {
        "profile": {
            "child_name": read_config().get("child_name", "Kind"),
            "birth_date": "",
            "notes": "",
        },
        "entries": [],
        "active_illness": None,
        "illness_history": [],
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }


def read_store() -> Dict[str, Any]:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_PATH.exists():
        store = default_store()
        write_store(store)
        return store

    try:
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Datendatei konnte nicht gelesen werden: {exc}")

    if not isinstance(data, dict):
        raise HTTPException(status_code=500, detail="Datendatei hat ein ungültiges Format.")

    data.setdefault("profile", default_store()["profile"])
    data.setdefault("entries", [])
    data.setdefault("deleted_entries", [])
    data.setdefault("active_illness", None)
    data.setdefault("illness_history", [])
    data.setdefault("created_at", utc_now())
    data.setdefault("updated_at", utc_now())

    # Ensure every existing entry has a persistent history array.
    # This prevents the frontend from falling back to only created/updated timestamps.
    for entry in data.get("entries", []):
        if not isinstance(entry, dict):
            continue
        entry.setdefault("symptom_images", [])
        entry.setdefault("illness_id", "")
        entry.setdefault("fluid_level", "")
        history = entry.get("history")
        if not isinstance(history, list) or not history:
            created_at = entry.get("created_at", data.get("created_at", utc_now()))
            created_by = entry.get("created_by", {})
            entry["history"] = [
                {
                    "action": "created",
                    "at": created_at,
                    "by": created_by if isinstance(created_by, dict) else {},
                    "fields": [],
                }
            ]

    return data


def write_store(data: Dict[str, Any]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = utc_now()
    tmp = DATA_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(DATA_PATH)


def check_pin(request: Request) -> None:
    config = read_config()
    if not config.get("pin_enabled"):
        return
    configured_pin = str(config.get("pin_code") or "")
    if not configured_pin:
        return
    provided = request.headers.get("x-kindgesund-pin", "")
    if provided != configured_pin:
        raise HTTPException(status_code=401, detail="PIN erforderlich oder falsch.")


def get_ha_user(request: Request) -> Dict[str, str]:
    """Read Home Assistant Ingress user headers.

    Home Assistant may provide these headers when the add-on is accessed through Ingress.
    Older entries or non-Ingress access may not contain them.
    """
    user_id = request.headers.get("x-remote-user-id", "") or request.headers.get("X-Remote-User-Id", "")
    user_name = request.headers.get("x-remote-user-name", "") or request.headers.get("X-Remote-User-Name", "")
    display_name = request.headers.get("x-remote-user-display-name", "") or request.headers.get("X-Remote-User-Display-Name", "")

    best_name = display_name or user_name or "Unbekannt"

    return {
        "id": user_id,
        "name": user_name,
        "display_name": display_name,
        "label": best_name,
    }


def tracked_entry_fields() -> List[str]:
    return [
        "date",
        "time",
        "temperature",
        "mood",
        "symptoms",
        "symptom_intensity",
        "custom_symptoms",
        "medication",
        "fluids_ml",
        "fluid_level",
        "food",
        "sleep",
        "diaper_or_toilet",
        "notes",
    ]


def changed_fields(before: Dict[str, Any], after: Dict[str, Any]) -> List[str]:
    return [change["field"] for change in detailed_changes(before, after)]


def detailed_changes(before: Dict[str, Any], after: Dict[str, Any]) -> List[Dict[str, Any]]:
    changes: List[Dict[str, Any]] = []
    for key in tracked_entry_fields():
        old_value = before.get(key)
        new_value = after.get(key)
        if old_value != new_value:
            changes.append(
                {
                    "field": key,
                    "before": old_value,
                    "after": new_value,
                }
            )
    return changes


def history_event(action: str, user: Dict[str, str], fields: Optional[List[str]] = None) -> Dict[str, Any]:
    return {
        "action": action,
        "at": utc_now(),
        "by": user,
        "fields": fields or [],
    }


class Profile(BaseModel):
    child_name: str = Field(default="Kind", max_length=80)
    birth_date: str = Field(default="", max_length=20)
    notes: str = Field(default="", max_length=2000)


class HealthEntryIn(BaseModel):
    date: str = Field(..., max_length=20)
    time: str = Field(default="", max_length=10)
    temperature: Optional[float] = None
    mood: str = Field(default="", max_length=40)
    symptoms: List[str] = Field(default_factory=list)
    symptom_intensity: Dict[str, str] = Field(default_factory=dict)
    custom_symptoms: str = Field(default="", max_length=500)
    medication: str = Field(default="", max_length=1000)
    fluids_ml: Optional[int] = None
    fluid_level: str = Field(default="", max_length=20)
    food: str = Field(default="", max_length=1000)
    sleep: str = Field(default="", max_length=1000)
    diaper_or_toilet: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=4000)
    symptom_images: List[Dict[str, Any]] = Field(default_factory=list)
    illness_id: str = Field(default="", max_length=120)


class HealthEntry(HealthEntryIn):
    id: str
    created_at: str
    updated_at: str
    created_by: Dict[str, str] = Field(default_factory=dict)
    updated_by: Dict[str, str] = Field(default_factory=dict)
    history: List[Dict[str, Any]] = Field(default_factory=list)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/config")
def api_config():
    config = read_config()
    safe = {k: v for k, v in config.items() if k != "pin_code"}
    safe["pin_required"] = bool(config.get("pin_enabled") and config.get("pin_code"))
    return safe


@app.get("/api/state")
def api_state(request: Request):
    check_pin(request)
    return read_store()


@app.put("/api/profile")
def api_save_profile(profile: Profile, request: Request):
    check_pin(request)
    store = read_store()
    store["profile"] = profile.model_dump()
    write_store(store)
    return store["profile"]

@app.get("/api/illness")
def api_get_illness(request: Request):
    check_pin(request)
    store = read_store()
    return {
        "active_illness": store.get("active_illness"),
        "illness_history": store.get("illness_history", []),
    }


@app.put("/api/illness")
async def api_set_illness(request: Request):
    check_pin(request)
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültige Infekt-Daten.")

    if payload is not None and not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Ungültiges Infekt-Format.")

    store = read_store()
    store["active_illness"] = payload
    write_store(store)
    return {"active_illness": store.get("active_illness")}


@app.delete("/api/illness/{illness_id}")
def api_delete_illness(illness_id: str, request: Request):
    check_pin(request)
    store = read_store()
    removed = False

    active = store.get("active_illness")
    if isinstance(active, dict) and str(active.get("id") or "") == illness_id:
        store["active_illness"] = None
        removed = True

    history = store.get("illness_history", [])
    if not isinstance(history, list):
        history = []

    next_history = []
    for illness in history:
        if isinstance(illness, dict) and str(illness.get("id") or "") == illness_id:
            removed = True
            continue
        next_history.append(illness)

    # Die Einträge selbst bleiben erhalten. Nur die Zuordnung zum gelöschten Infekt wird entfernt.
    affected_entries = 0
    for entry in store.get("entries", []):
        if isinstance(entry, dict) and str(entry.get("illness_id") or "") == illness_id:
            entry["illness_id"] = ""
            affected_entries += 1

    store["illness_history"] = next_history

    if not removed:
        raise HTTPException(status_code=404, detail="Infekt nicht gefunden.")

    write_store(store)
    return {
        "ok": True,
        "active_illness": store.get("active_illness"),
        "illness_history": store.get("illness_history", []),
        "affected_entries": affected_entries,
    }


@app.put("/api/illness/{illness_id}")
async def api_update_illness(illness_id: str, request: Request):
    check_pin(request)
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültige Infekt-Daten.")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Ungültiges Infekt-Format.")

    store = read_store()
    updated = None

    active = store.get("active_illness")
    if isinstance(active, dict) and str(active.get("id") or "") == illness_id:
        active.update(
            {
                "title": str(payload.get("title") or active.get("title") or "").strip(),
                "start": str(payload.get("start") or active.get("start") or "").strip(),
                "end": str(payload.get("end") or active.get("end") or "").strip(),
                "updated_at": utc_now(),
            }
        )
        store["active_illness"] = active
        updated = active
    else:
        history = store.get("illness_history", [])
        if not isinstance(history, list):
            history = []
        for idx, illness in enumerate(history):
            if isinstance(illness, dict) and str(illness.get("id") or "") == illness_id:
                illness.update(
                    {
                        "title": str(payload.get("title") or illness.get("title") or "").strip(),
                        "start": str(payload.get("start") or illness.get("start") or "").strip(),
                        "end": str(payload.get("end") or illness.get("end") or "").strip(),
                        "updated_at": utc_now(),
                    }
                )
                history[idx] = illness
                updated = illness
                break
        store["illness_history"] = history

    if not updated:
        raise HTTPException(status_code=404, detail="Infekt nicht gefunden.")

    write_store(store)
    return {
        "active_illness": store.get("active_illness"),
        "illness_history": store.get("illness_history", []),
        "illness": updated,
    }


@app.post("/api/illness/stop")
async def api_stop_illness(request: Request):
    check_pin(request)
    store = read_store()
    active = store.get("active_illness")

    if not active:
        return {
            "active_illness": None,
            "last_illness": None,
            "illness_history": store.get("illness_history", []),
        }

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    if not isinstance(payload, dict):
        payload = {}

    stopped = {
        **active,
        "end": payload.get("end") or active.get("end") or datetime.now(timezone.utc).date().isoformat(),
        "ended_at": utc_now(),
    }

    history = store.get("illness_history", [])
    if not isinstance(history, list):
        history = []
    history.append(stopped)

    store["active_illness"] = None
    store["illness_history"] = history[-50:]
    write_store(store)

    return {
        "active_illness": None,
        "last_illness": stopped,
        "illness_history": store.get("illness_history", []),
    }



def illness_matches_entry_date(illness: Any, entry_date: str) -> bool:
    if not isinstance(illness, dict):
        return False
    start = str(illness.get("start") or "")
    end = str(illness.get("end") or "")
    if not start or not entry_date:
        return False
    if entry_date < start:
        return False
    if end and entry_date > end:
        return False
    return True


def assign_active_illness_if_needed(store: Dict[str, Any], entry_data: Dict[str, Any]) -> Dict[str, Any]:
    if entry_data.get("illness_id"):
        return entry_data
    active = store.get("active_illness")
    if illness_matches_entry_date(active, str(entry_data.get("date") or "")):
        entry_data["illness_id"] = str(active.get("id") or "")
    else:
        entry_data.setdefault("illness_id", "")
    return entry_data


@app.post("/api/entries")
def api_create_entry(entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    user = get_ha_user(request)
    now = utc_now()
    entry_data = assign_active_illness_if_needed(store, entry.model_dump())
    item = HealthEntry(
        **entry_data,
        id=str(uuid.uuid4()),
        created_at=now,
        updated_at=now,
        created_by=user,
        updated_by=user,
        history=[
            {
                "action": "created",
                "at": now,
                "by": user,
                "fields": [],
            }
        ],
    ).model_dump()
    store["entries"].append(item)
    store["entries"].sort(key=lambda e: (e.get("date", ""), e.get("time", "")), reverse=True)
    write_store(store)
    return item


def delete_removed_uploads(old_entry: Dict[str, Any], new_entry: Dict[str, Any]) -> None:
    old_names = {upload_filename_from_ref(ref) for ref in (old_entry.get("symptom_images") or []) if upload_filename_from_ref(ref)}
    new_names = {upload_filename_from_ref(ref) for ref in (new_entry.get("symptom_images") or []) if upload_filename_from_ref(ref)}
    for filename in old_names - new_names:
        path = UPLOAD_DIR / filename
        try:
            if path.exists() and path.is_file():
                path.unlink()
        except Exception:
            pass


@app.put("/api/entries/{entry_id}")
def api_update_entry(entry_id: str, entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    user = get_ha_user(request)
    for idx, existing in enumerate(store["entries"]):
        if existing.get("id") == entry_id:
            now = utc_now()
            entry_data = entry.model_dump()
            if not entry_data.get("illness_id"):
                entry_data["illness_id"] = existing.get("illness_id", "")
            entry_data = assign_active_illness_if_needed(store, entry_data)
            changes = detailed_changes(existing, entry_data)
            fields = [change["field"] for change in changes]
            existing_history = existing.get("history", [])
            if not isinstance(existing_history, list):
                existing_history = []

            if not existing_history:
                existing_history = [
                    {
                        "action": "created",
                        "at": existing.get("created_at", now),
                        "by": existing.get("created_by", {}),
                        "fields": [],
                    }
                ]

            updated = HealthEntry(
                **entry_data,
                id=entry_id,
                created_at=existing.get("created_at", now),
                updated_at=now,
                created_by=existing.get("created_by", {}),
                updated_by=user,
                history=[
                    *existing_history,
                    {
                        "action": "updated",
                        "at": now,
                        "by": user,
                        "fields": fields,
                        "changes": changes,
                    },
                ],
            ).model_dump()
            delete_removed_uploads(existing, updated)
            store["entries"][idx] = updated
            store["entries"].sort(key=lambda e: (e.get("date", ""), e.get("time", "")), reverse=True)
            write_store(store)
            return updated
    raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")


def upload_filename_from_ref(ref: Any) -> Optional[str]:
    if isinstance(ref, str):
        candidates = [ref]
    elif isinstance(ref, dict):
        candidates = [
            str(ref.get("filename") or ""),
            str(ref.get("url") or ""),
            str(ref.get("path") or ""),
        ]
    else:
        return None

    for value in candidates:
        value = (value or "").strip()
        if not value:
            continue

        # Accept raw filenames, ./api/uploads/file.jpg, /api/uploads/file.jpg and URLs.
        clean = value.split("?", 1)[0].split("#", 1)[0].rstrip("/")
        name = Path(clean).name
        if name and name not in {".", ".."}:
            return name

    return None


def delete_uploads_for_entry(entry: Dict[str, Any]) -> None:
    images = entry.get("symptom_images") or []
    if not isinstance(images, list):
        return

    for ref in images:
        filename = upload_filename_from_ref(ref)
        if not filename:
            continue
        path = UPLOAD_DIR / filename
        try:
            if path.exists() and path.is_file():
                path.unlink()
        except Exception:
            # Deleting the entry should not fail only because a file could not be removed.
            pass


@app.delete("/api/entries/{entry_id}")
def api_delete_entry(entry_id: str, request: Request):
    check_pin(request)
    store = read_store()
    user = get_ha_user(request)
    entries = store.get("entries", [])
    existing = next((e for e in entries if e.get("id") == entry_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")

    deleted_entries = store.get("deleted_entries", [])
    if not isinstance(deleted_entries, list):
        deleted_entries = []

    existing_history = existing.get("history", [])
    if not isinstance(existing_history, list):
        existing_history = []

    deleted_snapshot = {
        **existing,
        "deleted_at": utc_now(),
        "deleted_by": user,
        "history": [
            *existing_history,
            history_event("deleted", user),
        ],
    }
    deleted_entries.append(deleted_snapshot)

    # Remove physical symptom image files as well.
    # The deleted entry snapshot keeps the metadata/history, but the images themselves are removed.
    delete_uploads_for_entry(existing)

    store["deleted_entries"] = deleted_entries[-200:]
    store["entries"] = [e for e in entries if e.get("id") != entry_id]
    write_store(store)
    return {"ok": True}


@app.get("/api/export")
def api_export(request: Request):
    check_pin(request)
    return JSONResponse(
        read_store(),
        headers={"Content-Disposition": 'attachment; filename="gesundheitstracker-export.json"'},
    )


def folder_size_bytes(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for item in path.rglob("*"):
        try:
            if item.is_file():
                total += item.stat().st_size
        except Exception:
            pass
    return total


def folder_file_count(path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    for item in path.rglob("*"):
        try:
            if item.is_file():
                count += 1
        except Exception:
            pass
    return count


@app.get("/api/storage")
def api_storage(request: Request):
    check_pin(request)

    diary_size = DATA_PATH.stat().st_size if DATA_PATH.exists() else 0
    uploads_size = folder_size_bytes(UPLOAD_DIR)
    uploads_count = folder_file_count(UPLOAD_DIR)
    data_dir_size = folder_size_bytes(DATA_PATH.parent)

    store = read_store()
    entries = store.get("entries", [])
    deleted_entries = store.get("deleted_entries", [])

    image_refs = 0
    if isinstance(entries, list):
        for entry in entries:
            if isinstance(entry, dict) and isinstance(entry.get("symptom_images"), list):
                image_refs += len(entry.get("symptom_images") or [])

    uploads = []
    if UPLOAD_DIR.exists():
        for path in sorted(UPLOAD_DIR.rglob("*"), key=lambda item: item.name.lower()):
            try:
                if not path.is_file():
                    continue
                suffix = path.suffix.lower()
                if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}:
                    continue
                stat = path.stat()
                uploads.append(
                    {
                        "filename": path.name,
                        "url": f"./api/uploads/{path.name}",
                        "size_bytes": stat.st_size,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                    }
                )
            except Exception:
                pass

    return {
        "total_bytes": data_dir_size,
        "diary_bytes": diary_size,
        "uploads_bytes": uploads_size,
        "uploads_count": uploads_count,
        "entries_count": len(entries) if isinstance(entries, list) else 0,
        "deleted_entries_count": len(deleted_entries) if isinstance(deleted_entries, list) else 0,
        "image_refs_count": image_refs,
        "data_path": str(DATA_PATH),
        "uploads_path": str(UPLOAD_DIR),
        "uploads": uploads,
    }


@app.get("/api/backup")
def api_backup(request: Request):
    check_pin(request)
    store = read_store()

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("diary.json", json.dumps(store, ensure_ascii=False, indent=2))

        if UPLOAD_DIR.exists():
            for path in UPLOAD_DIR.rglob("*"):
                if path.is_file():
                    archive.write(path, f"uploads/{path.name}")

        archive.writestr(
            "backup-info.json",
            json.dumps(
                {
                    "app": "Gesundheitstracker",
                    "created_at": utc_now(),
                    "format": "gesundheitstracker-zip-backup",
                    "contains": ["diary.json", "uploads"],
                },
                ensure_ascii=False,
                indent=2,
            ),
        )

    buffer.seek(0)
    filename = f"gesundheitstracker-backup-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.zip"
    return Response(
        buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/import")
async def api_import(request: Request):
    check_pin(request)

    content_type = (request.headers.get("content-type") or "").lower()
    raw = await request.body()

    if "application/zip" in content_type or raw[:4] == b"PK\x03\x04":
        try:
          with zipfile.ZipFile(io.BytesIO(raw), "r") as archive:
              if "diary.json" not in archive.namelist():
                  raise HTTPException(status_code=400, detail="ZIP-Backup enthält keine diary.json.")

              data = json.loads(archive.read("diary.json").decode("utf-8"))

              UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
              for name in archive.namelist():
                  if not name.startswith("uploads/") or name.endswith("/"):
                      continue
                  safe_name = Path(name).name
                  if not safe_name:
                      continue
                  (UPLOAD_DIR / safe_name).write_bytes(archive.read(name))
        except HTTPException:
          raise
        except Exception as exc:
          raise HTTPException(status_code=400, detail=f"ZIP-Backup konnte nicht gelesen werden: {exc}")
    else:
        try:
          data = json.loads(raw.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Ungültige JSON-Datei.")

    if not isinstance(data, dict) or "entries" not in data:
        raise HTTPException(status_code=400, detail="Die Datei sieht nicht wie ein Gesundheitstracker-Export aus.")

    data.setdefault("profile", default_store()["profile"])
    data.setdefault("created_at", utc_now())
    data["updated_at"] = utc_now()
    write_store(data)
    return {"ok": True}


class ImageUploadIn(BaseModel):
    name: str = Field(default="foto.jpg", max_length=200)
    content_type: str = Field(default="image/jpeg", max_length=80)
    data_url: str = Field(..., max_length=14_000_000)


@app.post("/api/uploads/json")
def api_upload_image_json(payload: ImageUploadIn, request: Request):
    check_pin(request)

    content_type = (payload.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/heic": ".heic",
        "image/heif": ".heif",
    }
    suffix = allowed.get(content_type)
    if not suffix:
        raise HTTPException(status_code=400, detail="Nur Bilddateien sind erlaubt.")

    data_url = payload.data_url or ""
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]

    try:
        data = base64.b64decode(data_url, validate=False)
    except Exception:
        raise HTTPException(status_code=400, detail="Bild konnte nicht gelesen werden.")

    max_bytes = 8 * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=400, detail="Bild ist zu groß. Maximal 8 MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:10]}{suffix}"
    path = UPLOAD_DIR / filename
    path.write_bytes(data)

    return {
        "filename": filename,
        "url": f"./api/uploads/{filename}",
        "content_type": content_type,
        "size": len(data),
    }


def remove_upload_reference_from_entry(entry: Dict[str, Any], filename: str) -> bool:
    images = entry.get("symptom_images")
    if not isinstance(images, list):
        return False

    next_images = []
    changed = False
    for ref in images:
        ref_name = upload_filename_from_ref(ref)
        if ref_name == filename:
            changed = True
            continue
        next_images.append(ref)

    if changed:
        entry["symptom_images"] = next_images
    return changed


@app.delete("/api/uploads/{filename}")
def api_delete_upload(filename: str, request: Request):
    check_pin(request)

    safe_name = Path(filename).name
    if not safe_name:
        raise HTTPException(status_code=400, detail="Ungültiger Dateiname.")

    path = UPLOAD_DIR / safe_name
    file_deleted = False
    if path.exists() and path.is_file():
        try:
            path.unlink()
            file_deleted = True
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Bild konnte nicht gelöscht werden: {exc}")

    store = read_store()
    changed = False
    affected_entries = 0

    for entry in store.get("entries", []):
        if isinstance(entry, dict):
            entry_changed = remove_upload_reference_from_entry(entry, safe_name)
            changed = entry_changed or changed
            if entry_changed:
                affected_entries += 1

    for entry in store.get("deleted_entries", []):
        if isinstance(entry, dict):
            entry_changed = remove_upload_reference_from_entry(entry, safe_name)
            changed = entry_changed or changed

    if changed:
        store["updated_at"] = utc_now()
        write_store(store)

    return {
        "ok": True,
        "filename": safe_name,
        "file_deleted": file_deleted,
        "references_removed": changed,
        "affected_entries": affected_entries,
    }

@app.get("/api/uploads/{filename}")
def api_get_upload(filename: str, request: Request):
    check_pin(request)
    safe_name = Path(filename).name
    path = UPLOAD_DIR / safe_name
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Bild nicht gefunden.")

    suffix = path.suffix.lower()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".heic": "image/heic",
        ".heif": "image/heif",
    }.get(suffix, "application/octet-stream")

    return Response(path.read_bytes(), media_type=media_type, headers={"Cache-Control": "private, max-age=3600"})


@app.get("/health")
def health():
    return {"ok": True}


app.mount("/assets", StaticFiles(directory=STATIC_DIR), name="assets")


@app.get("/{path:path}")
def frontend(path: str):
    return FileResponse(STATIC_DIR / "index.html")
