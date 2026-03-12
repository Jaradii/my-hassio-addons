import json
from datetime import datetime, timezone
from typing import Any

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response

OPTIONS_PATH = "/data/options.json"
DEFAULT_BASE_URL = "https://ollama.com/api"
DEFAULT_TIMEOUT = 600

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


def load_options() -> dict[str, Any]:
    try:
        with open(OPTIONS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    except Exception:
        pass
    return {}


def get_config() -> dict[str, Any]:
    options = load_options()

    api_key = str(options.get("api_key", "") or "").strip()
    base_url = str(options.get("base_url", DEFAULT_BASE_URL) or DEFAULT_BASE_URL).rstrip("/")
    force_model = str(options.get("force_model", "") or "").strip()
    request_timeout = options.get("request_timeout", DEFAULT_TIMEOUT)

    try:
        request_timeout = int(request_timeout)
    except Exception:
        request_timeout = DEFAULT_TIMEOUT

    visible_models_raw = options.get("visible_models", [])
    if not isinstance(visible_models_raw, list):
        visible_models_raw = []

    visible_models = [str(m).strip() for m in visible_models_raw if str(m).strip()]

    return {
        "api_key": api_key,
        "base_url": base_url,
        "force_model": force_model,
        "visible_models": visible_models,
        "request_timeout": request_timeout,
    }


def auth_headers(api_key: str) -> dict[str, str]:
    if not api_key:
        raise HTTPException(status_code=500, detail="Kein API-Key konfiguriert")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def response_model_item(name: str) -> dict[str, Any]:
    return {
        "name": name,
        "model": name,
        "modified_at": "1970-01-01T00:00:00Z",
        "size": 0,
        "digest": "",
        "details": {},
    }


def map_model_name(name: str, cfg: dict[str, Any]) -> str:
    name = (name or "").strip()
    if cfg["force_model"]:
        return cfg["force_model"]
    if name.endswith("-cloud"):
        return name[:-6]
    return name


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def json_response_or_error(resp: httpx.Response) -> JSONResponse:
    content_type = resp.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        try:
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        except Exception:
            return JSONResponse(status_code=502, content={"error": "Ungueltige JSON-Antwort upstream"})
    return JSONResponse(status_code=resp.status_code, content={"error": resp.text})


app = FastAPI(title="Ollama Cloud Proxy", version="2.2.1")


@app.get("/")
async def root() -> JSONResponse:
    cfg = get_config()
    return JSONResponse(
        {
            "service": "ollama-cloud-proxy",
            "base_url": cfg["base_url"],
            "force_model": cfg["force_model"],
            "visible_models": cfg["visible_models"],
        }
    )


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/api/version")
async def api_version() -> JSONResponse:
    return JSONResponse({"version": "cloud-proxy-2.2.1"})


@app.get("/api/tags")
async def api_tags() -> JSONResponse:
    cfg = get_config()

    if cfg["visible_models"]:
        return JSONResponse({"models": [response_model_item(name) for name in cfg["visible_models"]]})

    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        resp = await client.get(
            f"{cfg['base_url']}/tags",
            headers=auth_headers(cfg["api_key"]),
        )
    return json_response_or_error(resp)


@app.post("/api/pull")
async def api_pull(request: Request) -> JSONResponse:
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        payload = {}

    requested_model = str(payload.get("model", "") or "").strip()
    mapped_model = map_model_name(requested_model, cfg)

    return JSONResponse(
        {
            "status": "success",
            "detail": "Model considered available via cloud proxy",
            "requested_model": requested_model,
            "mapped_model": mapped_model,
        }
    )


@app.post("/api/show")
async def api_show(request: Request) -> JSONResponse:
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        payload = {}

    requested_model = str(payload.get("model", "") or "").strip()
    mapped_model = map_model_name(requested_model, cfg)

    return JSONResponse(
        {
            "license": "",
            "modelfile": f"FROM {mapped_model}",
            "parameters": "",
            "template": "",
            "details": {},
            "model_info": {},
            "capabilities": ["completion", "tools"],
            "modified_at": "1970-01-01T00:00:00Z",
        }
    )


@app.post("/api/chat")
async def api_chat(request: Request) -> Response:
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Ungueltiger JSON-Body"})

    if not isinstance(payload, dict):
        return JSONResponse(status_code=400, content={"error": "Ungueltiger JSON-Body"})

    requested_model = str(payload.get("model", "") or "").strip()
    mapped_model = map_model_name(requested_model, cfg)
    stream_requested = bool(payload.get("stream", False))

    payload["model"] = mapped_model
    payload["stream"] = False

    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        resp = await client.post(
            f"{cfg['base_url']}/chat",
            headers=auth_headers(cfg["api_key"]),
            json=payload,
        )

    if resp.status_code >= 400:
        return json_response_or_error(resp)

    try:
        data = resp.json()
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Ungueltige JSON-Antwort upstream"})

    if not stream_requested:
        return JSONResponse(content=data)

    message = data.get("message", {})
    if not isinstance(message, dict):
        message = {"role": "assistant", "content": ""}

    content = str(message.get("content", "") or "")

    chunk = {
        "model": requested_model or mapped_model,
        "created_at": data.get("created_at", now_iso()),
        "message": {
            "role": "assistant",
            "content": content,
        },
        "done": True,
        "done_reason": data.get("done_reason", "stop"),
        "total_duration": data.get("total_duration", 0),
        "load_duration": data.get("load_duration", 0),
        "prompt_eval_count": data.get("prompt_eval_count", 0),
        "prompt_eval_duration": data.get("prompt_eval_duration", 0),
        "eval_count": data.get("eval_count", 0),
        "eval_duration": data.get("eval_duration", 0),
    }

    ndjson = json.dumps(chunk, ensure_ascii=False) + "\n"
    return Response(
        content=ndjson,
        media_type="application/x-ndjson",
    )


@app.post("/api/generate")
async def api_generate(request: Request) -> Response:
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Ungueltiger JSON-Body"})

    if not isinstance(payload, dict):
        return JSONResponse(status_code=400, content={"error": "Ungueltiger JSON-Body"})

    requested_model = str(payload.get("model", "") or "").strip()
    mapped_model = map_model_name(requested_model, cfg)
    stream_requested = bool(payload.get("stream", False))

    payload["model"] = mapped_model
    payload["stream"] = False

    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        resp = await client.post(
            f"{cfg['base_url']}/generate",
            headers=auth_headers(cfg["api_key"]),
            json=payload,
        )

    if resp.status_code >= 400:
        return json_response_or_error(resp)

    try:
        data = resp.json()
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Ungueltige JSON-Antwort upstream"})

    if not stream_requested:
        return JSONResponse(content=data)

    response_text = str(data.get("response", "") or "")

    chunk = {
        "model": requested_model or mapped_model,
        "created_at": data.get("created_at", now_iso()),
        "response": response_text,
        "done": True,
        "done_reason": data.get("done_reason", "stop"),
        "total_duration": data.get("total_duration", 0),
        "load_duration": data.get("load_duration", 0),
        "prompt_eval_count": data.get("prompt_eval_count", 0),
        "prompt_eval_duration": data.get("prompt_eval_duration", 0),
        "eval_count": data.get("eval_count", 0),
        "eval_duration": data.get("eval_duration", 0),
    }

    ndjson = json.dumps(chunk, ensure_ascii=False) + "\n"
    return Response(
        content=ndjson,
        media_type="application/x-ndjson",
    )


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_api(path: str, request: Request):
    cfg = get_config()

    if not cfg["api_key"]:
        return JSONResponse(status_code=500, content={"error": "Kein API-Key konfiguriert"})

    raw_body = await request.body()
    body = raw_body

    if raw_body:
        try:
            payload = json.loads(raw_body.decode("utf-8"))
            if isinstance(payload, dict) and "model" in payload:
                payload["model"] = map_model_name(str(payload.get("model", "")), cfg)
                body = json.dumps(payload).encode("utf-8")
        except Exception:
            body = raw_body

    headers = {}
    for key, value in request.headers.items():
        if key.lower() in HOP_BY_HOP_HEADERS:
            continue
        if key.lower() == "authorization":
            continue
        headers[key] = value
    headers.update(auth_headers(cfg["api_key"]))

    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        resp = await client.request(
            method=request.method,
            url=f"{cfg['base_url']}/{path.lstrip('/')}",
            headers=headers,
            params=request.query_params,
            content=body,
        )

    return json_response_or_error(resp)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return PlainTextResponse(str(exc), status_code=500)


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=11434,
        log_level="info",
    )
