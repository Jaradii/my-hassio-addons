import json
from typing import Any, AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from starlette.background import BackgroundTask

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
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def get_config() -> dict[str, Any]:
    options = load_options()
    api_key = str(options.get("api_key", "") or "").strip()
    base_url = str(options.get("base_url", DEFAULT_BASE_URL) or DEFAULT_BASE_URL).rstrip("/")
    force_model = str(options.get("force_model", "") or "").strip()
    visible_models = options.get("visible_models", [])
    if not isinstance(visible_models, list):
        visible_models = []
    visible_models = [str(m).strip() for m in visible_models if str(m).strip()]
    request_timeout = options.get("request_timeout", DEFAULT_TIMEOUT)
    try:
        request_timeout = int(request_timeout)
    except Exception:
        request_timeout = DEFAULT_TIMEOUT

    return {
        "api_key": api_key,
        "base_url": base_url,
        "force_model": force_model,
        "visible_models": visible_models,
        "request_timeout": request_timeout,
    }


def build_auth_headers(api_key: str) -> dict[str, str]:
    if not api_key:
        raise HTTPException(status_code=500, detail="Kein API-Key konfiguriert")
    return {"Authorization": f"Bearer {api_key}"}


def filtered_forward_headers(request: Request, api_key: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in HOP_BY_HOP_HEADERS:
            continue
        if key.lower() == "authorization":
            continue
        headers[key] = value
    headers.update(build_auth_headers(api_key))
    return headers


def filter_response_headers(headers: httpx.Headers) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower() in HOP_BY_HOP_HEADERS:
            continue
        out[key] = value
    return out


def model_item(name: str) -> dict[str, Any]:
    return {
        "name": name,
        "model": name,
        "modified_at": "1970-01-01T00:00:00Z",
        "size": 0,
        "digest": "",
        "details": {
            "format": "cloud",
            "family": "cloud",
            "families": ["cloud"],
            "parameter_size": "",
            "quantization_level": "",
        },
    }


def get_effective_model(requested_model: str | None, cfg: dict[str, Any]) -> str:
    requested_model = (requested_model or "").strip()
    if cfg["force_model"]:
        return cfg["force_model"]
    if requested_model:
        return requested_model
    if cfg["visible_models"]:
        return cfg["visible_models"][0]
    return ""


def rewrite_model_if_needed(raw_body: bytes, cfg: dict[str, Any]) -> tuple[bytes, str]:
    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        payload = {}

    requested_model = payload.get("model") if isinstance(payload, dict) else None
    effective_model = get_effective_model(requested_model, cfg)

    if isinstance(payload, dict) and effective_model:
        payload["model"] = effective_model
        return json.dumps(payload).encode("utf-8"), effective_model

    return raw_body, effective_model


async def fake_pull_stream(model: str) -> AsyncIterator[bytes]:
    steps = [
        {"status": f"pulling manifest for {model}"},
        {"status": "verifying sha256 digest"},
        {"status": "writing manifest"},
        {"status": "removing any unused layers"},
        {"status": "success"},
    ]
    for step in steps:
        yield (json.dumps(step) + "\n").encode("utf-8")


app = FastAPI(title="Ollama Cloud Proxy", version="2.1.0")


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
    return JSONResponse({"version": "cloud-proxy-2.1.0"})


@app.get("/api/tags")
async def api_tags() -> JSONResponse:
    cfg = get_config()

    if cfg["force_model"]:
        return JSONResponse({"models": [model_item(cfg["force_model"])]})

    if cfg["visible_models"]:
        return JSONResponse({"models": [model_item(name) for name in cfg["visible_models"]]})

    url = f"{cfg['base_url']}/tags"

    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        response = await client.get(
            url,
            headers=build_auth_headers(cfg["api_key"]),
        )

    if response.status_code >= 400:
        return JSONResponse(
            status_code=response.status_code,
            content={"error": response.text},
        )

    return JSONResponse(content=response.json())


@app.post("/api/pull")
async def api_pull(request: Request):
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        payload = {}

    model = get_effective_model(payload.get("model"), cfg)
    stream = bool(payload.get("stream", True))

    if not model:
        return JSONResponse(status_code=400, content={"error": "Kein Modell angegeben"})

    # HA erwartet bei lokalen Ollama-Hosts, dass ein Pull möglich ist.
    # Für Cloud emulieren wir den Pull erfolgreich.
    if stream:
        return StreamingResponse(
            fake_pull_stream(model),
            media_type="application/x-ndjson",
        )

    return JSONResponse({"status": "success"})


@app.post("/api/show")
async def api_show(request: Request):
    cfg = get_config()
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        payload = {}

    model = get_effective_model(payload.get("model"), cfg)
    if not model:
        return JSONResponse(status_code=400, content={"error": "Kein Modell angegeben"})

    return JSONResponse(
        {
            "license": "",
            "modelfile": f"FROM {model}",
            "parameters": "",
            "template": "",
            "details": model_item(model)["details"],
            "model_info": {},
            "messages": [],
            "capabilities": ["completion", "tools"],
        }
    )


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_api(path: str, request: Request):
    cfg = get_config()

    if not cfg["api_key"]:
        return JSONResponse(status_code=500, content={"error": "Kein API-Key konfiguriert"})

    url = f"{cfg['base_url']}/{path.lstrip('/')}"

    raw_body = await request.body()
    body, _effective_model = rewrite_model_if_needed(raw_body, cfg)
    headers = filtered_forward_headers(request, cfg["api_key"])

    async with httpx.AsyncClient(timeout=None) as client:
        upstream_request = client.build_request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.query_params,
            content=body,
        )
        upstream_response = await client.send(upstream_request, stream=True)

    response_headers = filter_response_headers(upstream_response.headers)

    return StreamingResponse(
        upstream_response.aiter_raw(),
        status_code=upstream_response.status_code,
        headers=response_headers,
        background=BackgroundTask(upstream_response.aclose),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return PlainTextResponse(str(exc), status_code=500)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=11434,
        log_level="info",
    )
