import json
import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

APP_TITLE = "Ollama Chat"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://192.168.178.150:11434").rstrip("/")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "").strip()
DEFAULT_KEEP_ALIVE = os.getenv("DEFAULT_KEEP_ALIVE", "-1").strip()
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "180"))

app = FastAPI(title=APP_TITLE)

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Ollama Chat</title>
  <style>
    :root {
      --bg: #0b0f14;
      --panel: #121822;
      --panel-2: #182232;
      --text: #eef3fb;
      --muted: #9fb0c7;
      --accent: #4fd1c5;
      --accent-2: #2c7a7b;
      --danger: #ff6b6b;
      --border: rgba(255,255,255,.08);
      --shadow: 0 10px 30px rgba(0,0,0,.28);
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100%;
    }

    body {
      min-height: 100dvh;
    }

    .app {
      max-width: 920px;
      margin: 0 auto;
      min-height: 100dvh;
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 12px;
      padding: env(safe-area-inset-top) 14px env(safe-area-inset-bottom) 14px;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: rgba(11, 15, 20, 0.82);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--shadow);
      padding: 12px;
    }

    .title {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 700;
    }

    .controls {
      display: grid;
      gap: 10px;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 10px;
      align-items: center;
    }

    .row2 {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
    }

    @media (max-width: 720px) {
      .row, .row2 {
        grid-template-columns: 1fr;
      }
    }

    select, textarea, button {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--panel);
      color: var(--text);
      padding: 12px 14px;
      font-size: 16px;
      outline: none;
    }

    select:focus, textarea:focus {
      border-color: rgba(79, 209, 197, 0.55);
      box-shadow: 0 0 0 4px rgba(79, 209, 197, 0.14);
    }

    button {
      cursor: pointer;
      font-weight: 650;
      background: linear-gradient(180deg, var(--accent), var(--accent-2));
      color: #071014;
      border: none;
      min-height: 48px;
    }

    button.secondary {
      background: var(--panel-2);
      color: var(--text);
      border: 1px solid var(--border);
    }

    button.danger {
      background: #3a1f24;
      color: #ffd2d2;
      border: 1px solid rgba(255,107,107,.25);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--muted);
      padding: 8px 10px;
      border-radius: 999px;
      font-size: 12px;
    }

    .chat {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: auto;
      padding: 2px 2px 10px 2px;
    }

    .empty {
      border: 1px dashed var(--border);
      border-radius: 20px;
      padding: 24px;
      color: var(--muted);
      background: rgba(255,255,255,.02);
      text-align: center;
      margin-top: 18px;
    }

    .msg {
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: fadeIn .18s ease-out;
    }

    .user {
      align-items: flex-end;
    }

    .assistant {
      align-items: flex-start;
    }

    .bubble {
      width: fit-content;
      max-width: min(100%, 760px);
      padding: 14px 16px;
      border-radius: 20px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-wrap: break-word;
      box-shadow: var(--shadow);
    }

    .user .bubble {
      background: linear-gradient(180deg, #1f9a91, #166d67);
      color: white;
      border-bottom-right-radius: 8px;
    }

    .assistant .bubble {
      background: var(--panel);
      border: 1px solid var(--border);
      border-bottom-left-radius: 8px;
    }

    .meta {
      font-size: 12px;
      color: var(--muted);
      padding: 0 6px;
    }

    .composer {
      position: sticky;
      bottom: 0;
      background: rgba(11,15,20,.84);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--shadow);
      padding: 12px;
    }

    textarea {
      resize: none;
      min-height: 96px;
      max-height: 240px;
    }

    .composer-actions {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin-top: 10px;
      align-items: center;
    }

    .status {
      color: var(--muted);
      font-size: 13px;
      padding: 0 2px;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,.18);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin .8s linear infinite;
      vertical-align: -2px;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="topbar">
      <div class="title">Ollama Chat</div>
      <div class="controls">
        <div class="row">
          <select id="modelSelect"></select>
          <button id="reloadModelsBtn" class="secondary" type="button">Modelle laden</button>
          <button id="clearBtn" class="danger" type="button">Chat leeren</button>
        </div>
        <div class="row2">
          <div class="pill" id="serverInfo">Verbinde…</div>
          <div class="pill" id="modeInfo">Direkt zu 192.168.178.150:11434</div>
        </div>
      </div>
    </div>

    <div class="chat" id="chat"></div>

    <div class="composer">
      <textarea id="prompt" placeholder="Schreibe deine Nachricht…"></textarea>
      <div class="composer-actions">
        <div class="status" id="status">Bereit</div>
        <button id="sendBtn" type="button">Senden</button>
      </div>
    </div>
  </div>

  <script>
    const chatEl = document.getElementById("chat");
    const promptEl = document.getElementById("prompt");
    const sendBtn = document.getElementById("sendBtn");
    const clearBtn = document.getElementById("clearBtn");
    const statusEl = document.getElementById("status");
    const modelSelectEl = document.getElementById("modelSelect");
    const reloadModelsBtn = document.getElementById("reloadModelsBtn");
    const serverInfoEl = document.getElementById("serverInfo");

    const STORAGE_KEY = "ha_ollama_webapp_chat_v3";
    const SETTINGS_KEY = "ha_ollama_webapp_settings_v3";

    let messages = [];
    let busy = false;

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        model: modelSelectEl.value
      }));
    }

    function loadState() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(saved)) messages = saved;
      } catch (_) {}

      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        if (typeof settings.model === "string") modelSelectEl.dataset.savedValue = settings.model;
      } catch (_) {}
    }

    function escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function renderMessage(msg) {
      const wrapper = document.createElement("div");
      wrapper.className = "msg " + (msg.role === "user" ? "user" : "assistant");

      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.innerHTML = escapeHtml(msg.content || "");

      const meta = document.createElement("div");
      meta.className = "meta";
      const ts = new Date(msg.ts || Date.now());
      meta.textContent = `${msg.role === "user" ? "Du" : "Assistant"} • ${ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      wrapper.appendChild(bubble);
      wrapper.appendChild(meta);
      return wrapper;
    }

    function renderChat() {
      chatEl.innerHTML = "";
      if (!messages.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.innerHTML = "Noch kein Verlauf.<br>Wähle ein Modell und schreibe deine erste Nachricht.";
        chatEl.appendChild(empty);
        return;
      }

      for (const msg of messages) {
        chatEl.appendChild(renderMessage(msg));
      }

      chatEl.scrollTop = chatEl.scrollHeight;
    }

    async function loadModels() {
      serverInfoEl.textContent = "Lade Modelle…";
      try {
        const res = await fetch("./api/models");
        const data = await res.json();

        modelSelectEl.innerHTML = "";

        if (!data.models || !data.models.length) {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "Keine Modelle gefunden";
          modelSelectEl.appendChild(opt);
          serverInfoEl.textContent = "Keine Modelle gefunden";
          return;
        }

        for (const model of data.models) {
          const opt = document.createElement("option");
          opt.value = model.name;
          opt.textContent = model.name;
          modelSelectEl.appendChild(opt);
        }

        const savedValue = modelSelectEl.dataset.savedValue;
        if (savedValue && [...modelSelectEl.options].some(o => o.value === savedValue)) {
          modelSelectEl.value = savedValue;
        }

        if (!modelSelectEl.value && data.default_model && [...modelSelectEl.options].some(o => o.value === data.default_model)) {
          modelSelectEl.value = data.default_model;
        }

        if (!modelSelectEl.value && data.models.length) {
          modelSelectEl.value = data.models[0].name;
        }

        serverInfoEl.textContent = `Verbunden • ${data.models.length} Modell(e)`;
        saveState();
      } catch (err) {
        serverInfoEl.textContent = "Verbindung fehlgeschlagen";
        alert("Modelle konnten nicht geladen werden. Prüfe das Add-on-Log und die Ollama-URL.");
      }
    }

    async function sendMessage() {
      if (busy) return;

      const prompt = promptEl.value.trim();
      const model = modelSelectEl.value;

      if (!prompt) return;
      if (!model) {
        alert("Bitte zuerst ein Modell wählen.");
        return;
      }

      busy = true;
      sendBtn.disabled = true;
      promptEl.disabled = true;
      statusEl.innerHTML = '<span class="spinner"></span>Sende Anfrage…';

      const userMsg = {
        role: "user",
        content: prompt,
        ts: Date.now()
      };

      messages.push(userMsg);
      renderChat();
      saveState();
      promptEl.value = "";
      autoResize();

      try {
        const res = await fetch("./api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            message: prompt,
            history: messages
              .filter(m => m.role === "user" || m.role === "assistant")
              .slice(-12)
              .map(m => ({ role: m.role, content: m.content }))
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Unbekannter Fehler");
        }

        messages.push({
          role: "assistant",
          content: data.answer || "Keine Antwort erhalten.",
          ts: Date.now()
        });

        renderChat();
        saveState();
        statusEl.textContent = "Bereit";
      } catch (err) {
        messages.push({
          role: "assistant",
          content: "Fehler: " + (err.message || "Die Anfrage konnte nicht verarbeitet werden."),
          ts: Date.now()
        });
        renderChat();
        saveState();
        statusEl.textContent = "Fehler";
      } finally {
        busy = false;
        sendBtn.disabled = false;
        promptEl.disabled = false;
        promptEl.focus();
      }
    }

    function autoResize() {
      promptEl.style.height = "auto";
      promptEl.style.height = Math.min(promptEl.scrollHeight, 240) + "px";
    }

    promptEl.addEventListener("input", autoResize);
    promptEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener("click", sendMessage);
    reloadModelsBtn.addEventListener("click", loadModels);
    clearBtn.addEventListener("click", () => {
      if (!confirm("Den kompletten Chatverlauf im Browser löschen?")) return;
      messages = [];
      saveState();
      renderChat();
    });

    modelSelectEl.addEventListener("change", saveState);

    loadState();
    renderChat();
    autoResize();
    loadModels();
  </script>
</body>
</html>
"""

SYSTEM_PROMPT = """Du bist ein hilfreicher lokaler Assistent in Home Assistant.
Antworte immer auf Deutsch.
Antworte klar, präzise und ehrlich.
Wenn du etwas nicht sicher weißt, sage das offen.
Verwende saubere Absätze statt unnötig vieler Listen.
"""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str

def sanitize_history(history: List[ChatMessage], limit: int = 12) -> List[Dict[str, str]]:
    cleaned: List[Dict[str, str]] = []
    for item in history[-limit:]:
        role = (item.role or "").strip()
        content = (item.content or "").strip()
        if role in {"user", "assistant", "system"} and content:
            cleaned.append({"role": role, "content": content})
    return cleaned

def extract_models(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, dict):
        models = data.get("models", [])
        if isinstance(models, list):
            return [m for m in models if isinstance(m, dict) and m.get("name")]
    return []

def join_ndjson_chunks(text: str) -> Optional[str]:
    parts: List[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue

        if isinstance(obj, dict):
            message = obj.get("message")
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, str) and content:
                    parts.append(content)

            response = obj.get("response")
            if isinstance(response, str) and response:
                parts.append(response)

            content = obj.get("content")
            if isinstance(content, str) and content:
                parts.append(content)

    joined = "".join(parts).strip()
    return joined or None

def extract_text_from_response(data: Any) -> Optional[str]:
    if isinstance(data, dict):
        message = data.get("message")
        if isinstance(message, dict):
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()

        response = data.get("response")
        if isinstance(response, str) and response.strip():
            return response.strip()

        content = data.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()

        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                msg = first.get("message")
                if isinstance(msg, dict):
                    c = msg.get("content")
                    if isinstance(c, str) and c.strip():
                        return c.strip()

                text = first.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()

        error = data.get("error")
        if isinstance(error, str) and error.strip():
            return f"Upstream-Fehler: {error.strip()}"

    if isinstance(data, str):
        ndjson_joined = join_ndjson_chunks(data)
        if ndjson_joined:
            return ndjson_joined

        stripped = data.strip()
        if stripped:
            return stripped

    return None

async def fetch_json_or_text(
    method: str,
    url: str,
    json_body: Optional[Dict[str, Any]] = None,
) -> Any:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.request(method=method, url=url, json=json_body)
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "").lower()
        text = resp.text

        if "application/json" in content_type or "text/json" in content_type:
            try:
                return resp.json()
            except Exception:
                return text

        if "application/x-ndjson" in content_type or "ndjson" in content_type:
            return text

        try:
            return resp.json()
        except Exception:
            return text

async def fetch_models() -> List[Dict[str, Any]]:
    data = await fetch_json_or_text("GET", f"{OLLAMA_BASE_URL}/api/tags")
    return extract_models(data)

def history_to_prompt(history: List[Dict[str, str]], user_message: str) -> str:
    lines: List[str] = []
    for item in history:
        role = item.get("role", "")
        content = item.get("content", "")
        if not content:
            continue
        if role == "system":
            lines.append(f"System:\n{content}\n")
        elif role == "assistant":
            lines.append(f"Assistant:\n{content}\n")
        else:
            lines.append(f"Nutzer:\n{content}\n")
    lines.append(f"Nutzer:\n{user_message}\n")
    lines.append("Assistant:\n")
    return "\n".join(lines)

async def try_chat_endpoint(model: str, messages: List[Dict[str, str]]) -> Optional[str]:
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "keep_alive": DEFAULT_KEEP_ALIVE,
    }
    data = await fetch_json_or_text("POST", f"{OLLAMA_BASE_URL}/api/chat", json_body=payload)
    return extract_text_from_response(data)

async def try_generate_endpoint(model: str, messages: List[Dict[str, str]], user_message: str) -> Optional[str]:
    prompt = history_to_prompt(messages, user_message)
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "keep_alive": DEFAULT_KEEP_ALIVE,
    }
    data = await fetch_json_or_text("POST", f"{OLLAMA_BASE_URL}/api/generate", json_body=payload)
    return extract_text_from_response(data)

async def try_openai_endpoint(model: str, messages: List[Dict[str, str]]) -> Optional[str]:
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }
    data = await fetch_json_or_text("POST", f"{OLLAMA_BASE_URL}/v1/chat/completions", json_body=payload)
    return extract_text_from_response(data)

async def ask_upstream(model: str, messages: List[Dict[str, str]], user_message: str) -> str:
    attempts: List[str] = []

    for label, func in [
        ("api/chat", lambda: try_chat_endpoint(model, messages)),
        ("api/generate", lambda: try_generate_endpoint(model, messages, user_message)),
        ("v1/chat/completions", lambda: try_openai_endpoint(model, messages)),
    ]:
        try:
            answer = await func()
            if answer and answer.strip():
                return answer
            attempts.append(f"{label}: leere oder nicht auswertbare Antwort")
        except httpx.HTTPStatusError as exc:
            body = ""
            try:
                body = exc.response.text[:400]
            except Exception:
                pass
            attempts.append(f"{label}: HTTP {exc.response.status_code} {body}")
        except Exception as exc:
            attempts.append(f"{label}: {exc}")

    raise HTTPException(
        status_code=502,
        detail=" | ".join(attempts)[:1500],
    )

@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(INDEX_HTML)

@app.get("/api/models")
async def models() -> Dict[str, Any]:
    try:
        models = await fetch_models()
        default_model = DEFAULT_MODEL if DEFAULT_MODEL else (models[0]["name"] if models else "")
        return {
            "models": models,
            "default_model": default_model,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Modelle konnten nicht geladen werden: {exc}") from exc

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    user_message = req.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Leere Nachricht.")

    history = sanitize_history(req.history, limit=12)

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *history[:-1],
            {"role": "user", "content": user_message},
        ]
        answer = await ask_upstream(req.model, messages, user_message)
        return ChatResponse(answer=answer)

    except HTTPException:
        raise
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Netzwerkfehler: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interner Fehler: {exc}") from exc
