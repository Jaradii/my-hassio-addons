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

app = FastAPI(title="KindGesund", version="1.1.0")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_config() -> Dict[str, Any]:
    defaults = {
        "app_title": "KindGesund",
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
    data.setdefault("created_at", utc_now())
    data.setdefault("updated_at", utc_now())
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


class HealthEntry(HealthEntryIn):
    id: str
    created_at: str
    updated_at: str


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


@app.post("/api/entries")
def api_create_entry(entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    item = HealthEntry(
        **entry.model_dump(),
        id=str(uuid.uuid4()),
        created_at=utc_now(),
        updated_at=utc_now(),
    ).model_dump()
    store["entries"].append(item)
    store["entries"].sort(key=lambda e: (e.get("date", ""), e.get("time", "")), reverse=True)
    write_store(store)
    return item


@app.put("/api/entries/{entry_id}")
def api_update_entry(entry_id: str, entry: HealthEntryIn, request: Request):
    check_pin(request)
    store = read_store()
    for idx, existing in enumerate(store["entries"]):
        if existing.get("id") == entry_id:
            updated = HealthEntry(
                **entry.model_dump(),
                id=entry_id,
                created_at=existing.get("created_at", utc_now()),
                updated_at=utc_now(),
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
    before = len(store["entries"])
    store["entries"] = [e for e in store["entries"] if e.get("id") != entry_id]
    if len(store["entries"]) == before:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")
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
