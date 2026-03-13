import os
from typing import Dict

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

APP_TITLE = "Ollama Proxy"
UPSTREAM_BASE_URL = os.getenv("UPSTREAM_BASE_URL", "").rstrip("/")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "600"))

app = FastAPI(title=APP_TITLE)


def strip_hop_by_hop_headers(headers: Dict[str, str]) -> Dict[str, str]:
    excluded = {
        "host",
        "content-length",
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
    }
    result = {}
    for key, value in headers.items():
        if key.lower() not in excluded:
            result[key] = value
    return result


async def forward_request(request: Request, path: str) -> Response:
    if not UPSTREAM_BASE_URL:
        return JSONResponse(
            status_code=500,
            content={"error": "UPSTREAM_BASE_URL ist nicht gesetzt"},
        )

    url = f"{UPSTREAM_BASE_URL}{path}"
    method = request.method.upper()
    headers = strip_hop_by_hop_headers(dict(request.headers))
    body = await request.body()
    query_params = dict(request.query_params)

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
            upstream_response = await client.request(
                method=method,
                url=url,
                headers=headers,
                params=query_params,
                content=body,
            )

        content_type = upstream_response.headers.get("content-type", "application/octet-stream")
        media_type = content_type.split(";")[0].strip()

        passthrough_headers = {}
        for key, value in upstream_response.headers.items():
            key_lower = key.lower()
            if key_lower in {
                "content-type",
                "content-length",
                "connection",
                "transfer-encoding",
                "content-encoding",
            }:
                continue
            passthrough_headers[key] = value

        return Response(
            content=upstream_response.content,
            status_code=upstream_response.status_code,
            media_type=media_type,
            headers=passthrough_headers,
        )

    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": f"Upstream nicht erreichbar: {exc}"},
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Interner Proxy-Fehler: {exc}"},
        )


@app.get("/")
async def root():
    return {
        "ok": True,
        "service": APP_TITLE,
        "upstream": UPSTREAM_BASE_URL,
    }


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/api/tags")
async def api_tags(request: Request):
    return await forward_request(request, "/api/tags")


@app.post("/api/chat")
async def api_chat(request: Request):
    return await forward_request(request, "/api/chat")


@app.post("/api/generate")
async def api_generate(request: Request):
    return await forward_request(request, "/api/generate")


@app.get("/api/version")
async def api_version(request: Request):
    return await forward_request(request, "/api/version")
