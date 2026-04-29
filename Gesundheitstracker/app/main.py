import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DATA_PATH = Path(os.environ.get("KINDGESUND_DATA", "/data/diary.json"))
CONFIG_PATH = Path(os.environ.get("KINDGESUND_CONFIG", "/data/options.json"))
STATIC_DIR = Path(__file__).parent / "static"

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
    data.setdefault("created_at", utc_now())
    data.setdefault("updated_at", utc_now())

    # Ensure every existing entry has a persistent history array.
    # This prevents the frontend from falling back to only created/updated timestamps.
    for entry in data.get("entries", []):
        if not isinstance(entry, dict):
            continue
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
        "custom_symptoms",
        "medication",
        "fluids_ml",
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
    custom_symptoms: str = Field(default="", max_length=500)
    medication: str = Field(default="", max_length=1000)
    fluids_ml: Optional[int] = None
    food: str = Field(default="", max_length=1000)
    sleep: str = Field(default="", max_length=1000)
    diaper_or_toilet: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=4000)



class QuickFluidIn(BaseModel):
    ml: int = Field(ge=0, le=5000)
    date: Optional[str] = None
    time: Optional[str] = None


class QuickTemperatureIn(BaseModel):
    temperature: float = Field(ge=30, le=45)
    date: Optional[str] = None
    time: Optional[str] = None


class QuickMoodIn(BaseModel):
    mood: str
    date: Optional[str] = None
    time: Optional[str] = None


class QuickSymptomIn(BaseModel):
    symptom: str
    date: Optional[str] = None
    time: Optional[str] = None


class QuickMedicationIn(BaseModel):
    medication: str
    date: Optional[str] = None
    time: Optional[str] = None


class QuickFoodSleepIn(BaseModel):
    food: str = ""
    sleep: str = ""
    date: Optional[str] = None
    time: Optional[str] = None


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



def local_today() -> str:
    # Browser/UI uses local dates. The add-on usually runs in the HA host timezone,
    # so datetime.now() is the best simple default for server-side quick actions.
    return datetime.now().date().isoformat()


def local_now_time() -> str:
    return datetime.now().strftime("%H:%M")


def quick_base_entry(date_value: Optional[str] = None, time_value: Optional[str] = None) -> Dict[str, Any]:
    return {
        "date": date_value or local_today(),
        "time": time_value or local_now_time(),
        "temperature": None,
        "mood": "",
        "symptoms": [],
        "custom_symptoms": "",
        "medication": "",
        "fluids_ml": None,
        "food": "",
        "sleep": "",
        "diaper_or_toilet": "",
        "notes": "",
    }


def create_entry_from_dict(entry_data: Dict[str, Any], request: Request) -> Dict[str, Any]:
    store = read_store()
    user = get_ha_user(request)
    now = utc_now()
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
    store["updated_at"] = utc_now()
    write_store(store)
    return item


@app.post("/api/entries")
def api_create_entry(entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    user = get_ha_user(request)
    now = utc_now()
    item = HealthEntry(
        **entry.model_dump(),
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



@app.post("/api/quick/fluid")
def api_quick_fluid(payload: QuickFluidIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    entry["fluids_ml"] = payload.ml
    return create_entry_from_dict(entry, request)


@app.post("/api/quick/temperature")
def api_quick_temperature(payload: QuickTemperatureIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    entry["temperature"] = payload.temperature
    return create_entry_from_dict(entry, request)


@app.post("/api/quick/mood")
def api_quick_mood(payload: QuickMoodIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    entry["mood"] = payload.mood.strip()
    return create_entry_from_dict(entry, request)


@app.post("/api/quick/symptom")
def api_quick_symptom(payload: QuickSymptomIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    symptom = payload.symptom.strip()
    entry["symptoms"] = [symptom] if symptom else []
    return create_entry_from_dict(entry, request)


@app.post("/api/quick/medication")
def api_quick_medication(payload: QuickMedicationIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    entry["medication"] = payload.medication.strip()
    return create_entry_from_dict(entry, request)


@app.post("/api/quick/food-sleep")
def api_quick_food_sleep(payload: QuickFoodSleepIn, request: Request):
    check_pin(request)
    entry = quick_base_entry(payload.date, payload.time)
    entry["food"] = payload.food.strip()
    entry["sleep"] = payload.sleep.strip()
    return create_entry_from_dict(entry, request)

@app.put("/api/entries/{entry_id}")
def api_update_entry(entry_id: str, entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    user = get_ha_user(request)
    for idx, existing in enumerate(store["entries"]):
        if existing.get("id") == entry_id:
            now = utc_now()
            entry_data = entry.model_dump()
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
            store["entries"][idx] = updated
            store["entries"].sort(key=lambda e: (e.get("date", ""), e.get("time", "")), reverse=True)
            write_store(store)
            return updated
    raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")


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

    store["deleted_entries"] = deleted_entries[-200:]
    store["entries"] = [e for e in entries if e.get("id") != entry_id]
    write_store(store)
    return {"ok": True}


@app.get("/api/export")
def api_export(request: Request):
    check_pin(request)
    return JSONResponse(
        read_store(),
        headers={"Content-Disposition": 'attachment; filename="kindgesund-export.json"'},
    )


@app.post("/api/import")
async def api_import(request: Request):
    check_pin(request)
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültige JSON-Datei.")
    if not isinstance(data, dict) or "entries" not in data:
        raise HTTPException(status_code=400, detail="Die Datei sieht nicht wie ein KindGesund-Export aus.")
    data.setdefault("profile", default_store()["profile"])
    data.setdefault("created_at", utc_now())
    data["updated_at"] = utc_now()
    write_store(data)
    return {"ok": True}


@app.get("/health")
def health():
    return {"ok": True}


app.mount("/assets", StaticFiles(directory=STATIC_DIR), name="assets")


@app.get("/{path:path}")
def frontend(path: str):
    return FileResponse(STATIC_DIR / "index.html")
