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

    out_message = {
        "role": str(message.get("role", "assistant") or "assistant"),
        "content": str(message.get("content", "") or ""),
    }

    # WICHTIG: Tool Calls durchreichen, sonst kann HA keine Live-Daten abfragen
    if "tool_calls" in message and isinstance(message["tool_calls"], list):
        out_message["tool_calls"] = message["tool_calls"]

    # Optional Thinking mitgeben, falls vorhanden
    if "thinking" in message and message["thinking"] is not None:
        out_message["thinking"] = message["thinking"]

    chunk = {
        "model": requested_model or mapped_model,
        "created_at": data.get("created_at", now_iso()),
        "message": out_message,
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
