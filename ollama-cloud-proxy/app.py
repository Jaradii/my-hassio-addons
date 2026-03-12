import json
from typing import Any

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

    model_aliases_raw = options.get("model_aliases", {})
    if not isinstance(model_aliases_raw, dict):
        model_aliases_raw = {}

    model_aliases = {
        str(k).strip(): str(v).strip()
        for k, v in model_aliases_raw.items()
        if str(k).strip() and str(v).strip()
    }

    return {
        "api_key": api_key,
        "base_url": base_url,
        "force_model": force_model,
        "visible_models": visible_models,
        "model_aliases": model_aliases,
        "request_timeout": request_timeout,
    }


def auth_headers(api_key: str) -> dict[str, str]:
    if not api_key:
        raise HTTPException(status_code=500, detail="Kein API-Key konfiguriert")
    return {"Authorization": f"Bearer {api_key}"}


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
    return cfg["model_aliases"].get(name, name)


def rewrite_model_field(raw_body: bytes, cfg: dict[str, Any]) -> bytes:
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return raw_body

    if isinstance(payload, dict) and "model" in payload:
        payload["model"] = map_model_name(str(payload.get("model", "")), cfg)
        return json.dumps(payload).encode("utf-8")

    return raw_body


def filtered_forward_headers(request: Request, api_key: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in HOP_BY_HOP_HEADERS:
            continue
        if key.lower() == "authorization":
            continue
        headers[key] = value
    headers.update(auth_headers(api_key))
    return headers


def filter_response_headers(headers: httpx.Headers) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower() in HOP_BY_HOP_HEADERS:
            continue
        out[key] = value
    return out


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
            "model_aliases": cfg["model_aliases"],
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

    if cfg["visible_models"]:
        return JSONResponse(
            {
                "models": [response_model_item(name) for name in cfg["visible_models"]]
            }
        )

    url = f"{cfg['base_url']}/tags"
    async with httpx.AsyncClient(timeout=cfg["request_timeout"]) as client:
        response = await client.get(url, headers=auth_headers(cfg["api_key"]))

    return JSONResponse(
        status_code=response.status_code,
        content=response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text},
    )


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


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_api(path: str, request: Request):
    cfg = get_config()

    if not cfg["api_key"]:
        return JSONResponse(status_code=500, content={"error": "Kein API-Key konfiguriert"})

    raw_body = await request.body()
    body = rewrite_model_field(raw_body, cfg)

    url = f"{cfg['base_url']}/{path.lstrip('/')}"
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

    uvicorn.run("app:app", host="0.0.0.0", port=11434, log_level="info")
