import json
import os
import threading
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

APP_TITLE = "Ollama Chat"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama.com/api").rstrip("/")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "").strip()
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "").strip()
DEFAULT_MODEL = (os.getenv("DEFAULT_MODEL", "qwen3.5:397b-cloud").strip() or "qwen3.5:397b-cloud")
DEFAULT_KEEP_ALIVE = os.getenv("DEFAULT_KEEP_ALIVE", "5m").strip()
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "180"))
BRAVE_COUNTRY = os.getenv("BRAVE_COUNTRY", "de").strip() or "de"
BRAVE_SEARCH_LANG = os.getenv("BRAVE_SEARCH_LANG", "de").strip() or "de"
BRAVE_RESULT_COUNT = int(os.getenv("BRAVE_RESULT_COUNT", "5"))

SYSTEM_PROMPT = """Du bist ein Experte, der Dinge doppelt überprüft, du bist skeptisch und recherchierst.
Ich habe nicht immer Recht. Du auch nicht, aber wir beide streben nach Genauigkeit.
Verwende keine Sternchenzeichen in deinen Antworten."""

DATA_DIR = "/data"
CHATS_FILE = os.path.join(DATA_DIR, "chats.json")
STORE_LOCK = threading.Lock()

app = FastAPI(title=APP_TITLE)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    message: str
    use_web_search: bool = False
    history: List[ChatMessage] = []
    chat_id: Optional[str] = None


class SearchSource(BaseModel):
    title: str
    url: str
    description: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SearchSource] = []
    chat_id: Optional[str] = None


class ChatRenameRequest(BaseModel):
    title: str


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
      --panel-3: #0f141d;
      --text: #eef3fb;
      --muted: #9fb0c7;
      --accent: #5F82AA;
      --accent-2: #4f7197;
      --danger: #ff6b6b;
      --danger-bg: #3a1f24;
      --border: rgba(255,255,255,.08);
      --shadow: 0 8px 18px rgba(0,0,0,.18);
      --radius: 18px;
      --btn-radius: 10px;
      --safe-top: env(safe-area-inset-top);
      --safe-bottom: env(safe-area-inset-bottom);
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
      height: 100%;
      overflow: hidden;
    }

    body {
      min-height: 100dvh;
      overflow: hidden;
    }

    .mobile-sidebar-backdrop {
      display: none;
    }

    .layout {
      max-width: 1320px;
      margin: 0 auto;
      height: 100dvh;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 14px;
      padding: calc(var(--safe-top) + 12px) 12px calc(var(--safe-bottom) + 12px) 12px;
      overflow: hidden;
    }

    .sidebar {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(11, 15, 20, 0.9);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
      padding: 12px;
      display: grid;
      grid-template-rows: auto auto 1fr;
      gap: 10px;
      min-width: 0;
      overflow: hidden;
      height: 100%;
    }

    .sidebar-header {
      display: grid;
      gap: 10px;
    }

    .app {
      height: 100%;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      gap: 10px;
      min-width: 0;
      overflow: hidden;
    }

    .topbar {
      background: rgba(11, 15, 20, 0.9);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 10px 12px;
      flex: 0 0 auto;
    }

    .topbar-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto auto auto;
      gap: 8px;
      align-items: center;
    }

    .topbar-actions {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      justify-self: end;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.2px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .title-sub {
      font-size: 12px;
      color: var(--muted);
      margin-top: 2px;
    }

    .settings-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(11, 15, 20, 0.9);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
      padding: 10px;
      flex: 0 0 auto;
    }

    .settings-card.hidden {
      display: none;
    }

    details.settings-panel summary {
      list-style: none;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 2px;
      font-size: 14px;
      font-weight: 600;
    }

    details.settings-panel summary::-webkit-details-marker {
      display: none;
    }

    .settings-content {
      display: grid;
      gap: 10px;
      margin-top: 10px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      align-items: center;
    }

    .settings-grid-2 {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 10px;
      align-items: center;
    }

    .section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }

    .history-list {
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 2px;
      min-height: 0;
    }

    .history-item-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: stretch;
    }

    .history-item {
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      border-radius: 10px;
      padding: 10px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: border-color .15s ease, transform .15s ease;
      box-shadow: none;
    }

    .history-item:active {
      transform: scale(0.995);
    }

    .history-item.active {
      border-color: rgba(95,130,170,.55);
      box-shadow: 0 0 0 2px rgba(95,130,170,.14);
    }

    .history-delete-btn {
      width: 40px;
      min-width: 40px;
      max-width: 40px;
      min-height: 40px;
      align-self: center;
      padding: 0;
      border-radius: 10px;
      background: var(--danger-bg);
      color: #ffd2d2;
      border: 1px solid rgba(255,107,107,.20);
      font-size: 16px;
      line-height: 1;
    }

    .history-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
      line-height: 1.25;
    }

    .history-sub {
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    select, textarea, button, input[type="text"] {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--btn-radius);
      background: var(--panel);
      color: var(--text);
      padding: 11px 12px;
      font-size: 16px;
      outline: none;
      min-height: 44px;
      box-shadow: none;
    }

    select:focus, textarea:focus, input[type="text"]:focus {
      border-color: rgba(95,130,170,.65);
      box-shadow: 0 0 0 3px rgba(95,130,170,.14);
    }

    button {
      cursor: pointer;
      font-weight: 650;
      background: var(--accent);
      color: #071014;
      border: 1px solid transparent;
      min-height: 44px;
      box-shadow: none;
    }

    button.secondary {
      background: var(--panel-2);
      color: var(--text);
      border: 1px solid var(--border);
    }

    button.danger {
      background: var(--danger-bg);
      color: #ffd2d2;
      border: 1px solid rgba(255,107,107,.20);
    }

    .icon-btn {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      min-height: 44px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      line-height: 1;
      border-radius: var(--btn-radius);
    }

    .toggle-icon-btn {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      min-height: 44px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--btn-radius);
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      cursor: pointer;
      position: relative;
      font-size: 18px;
      box-shadow: none;
    }

    .toggle-icon-btn input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      margin: 0;
    }

    .toggle-icon-btn.is-on {
      background: var(--accent);
      color: #071014;
      border-color: transparent;
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
      min-height: 34px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chat {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 2px;
      min-height: 0;
      height: 100%;
    }

    .empty {
      border: 1px dashed var(--border);
      border-radius: 18px;
      padding: 20px;
      color: var(--muted);
      background: rgba(255,255,255,.02);
      text-align: center;
      margin-top: 12px;
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
      max-width: min(100%, 820px);
      padding: 13px 15px;
      border-radius: 18px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      box-shadow: var(--shadow);
    }

    .user .bubble {
      background: var(--accent-2);
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

    .sources {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
      max-width: min(100%, 820px);
    }

    .source-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--text);
      border: 1px solid var(--border);
      background: var(--panel-2);
      padding: 9px 11px;
      border-radius: 10px;
      font-size: 13px;
      max-width: 100%;
    }

    .composer {
      background: rgba(11,15,20,.9);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 10px;
      flex: 0 0 auto;
    }

    textarea {
      resize: none;
      min-height: 92px;
      max-height: 200px;
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
      min-width: 0;
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

    .desktop-only {
      display: inline-flex;
    }

    .mobile-only {
      display: none;
    }

    @media (max-width: 980px) {
      .desktop-only {
        display: none !important;
      }

      .mobile-only {
        display: inline-flex;
      }

      .layout {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: min(82vw, 320px);
        max-width: 320px;
        min-width: 240px;
        min-height: 100dvh;
        border-radius: 0 18px 18px 0;
        z-index: 60;
        transform: translateX(-105%);
        transition: transform .22s ease;
        padding: calc(var(--safe-top) + 10px) 10px calc(var(--safe-bottom) + 10px) 10px;
      }

      body.sidebar-open .sidebar {
        transform: translateX(0);
      }

      .mobile-sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.42);
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s ease;
        z-index: 50;
      }

      body.sidebar-open .mobile-sidebar-backdrop {
        opacity: 1;
        pointer-events: auto;
      }

      .app {
        grid-template-rows: auto auto minmax(0, 1fr) auto;
      }

      .topbar-row {
        grid-template-columns: auto minmax(0, 1fr) auto auto auto;
      }

      .settings-grid,
      .settings-grid-2 {
        grid-template-columns: 1fr;
      }

      .bubble {
        max-width: 96%;
        font-size: 15px;
        line-height: 1.5;
      }

      .composer-actions {
        grid-template-columns: 1fr;
      }

      .status {
        order: 2;
      }

      .composer-actions button {
        order: 1;
      }

      .source-chip {
        width: 100%;
      }
    }

    @media (max-width: 560px) {
      .layout {
        padding: calc(var(--safe-top) + 8px) 8px calc(var(--safe-bottom) + 8px) 8px;
      }

      .topbar, .settings-card, .composer {
        border-radius: 18px;
      }

      .title {
        font-size: 16px;
      }

      .title-sub {
        font-size: 11px;
      }

      select, textarea, button, input[type="text"] {
        font-size: 16px;
        padding: 10px 11px;
        min-height: 42px;
      }

      .icon-btn,
      .toggle-icon-btn,
      .history-delete-btn {
        width: 42px;
        min-width: 42px;
        max-width: 42px;
        min-height: 42px;
      }

      .bubble {
        max-width: 97%;
        padding: 12px 13px;
      }

      .sidebar {
        width: min(80vw, 300px);
        max-width: 300px;
        min-width: 230px;
      }

      textarea {
        min-height: 84px;
      }
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
  <div class="mobile-sidebar-backdrop" id="sidebarBackdrop"></div>

  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="section-title">Verläufe</div>
        <button id="newChatBtn" type="button">Neuer Chat</button>
      </div>

      <div>
        <input id="searchChatsInput" type="text" placeholder="Verläufe durchsuchen…" />
      </div>

      <div class="history-list" id="historyList"></div>
    </aside>

    <main class="app">
      <div class="topbar">
        <div class="topbar-row">
          <button id="mobileHistoryToggle" class="secondary icon-btn mobile-only" type="button">☰</button>

          <div>
            <div class="title">Ollama Chat</div>
            <div class="title-sub" id="serverInfo">Verbinde…</div>
          </div>

          <button id="toggleSettingsBtn" class="secondary icon-btn" type="button" title="Einstellungen einblenden oder ausblenden">⚙</button>

          <div class="topbar-actions">
            <label id="webSearchToggleBtn" class="toggle-icon-btn" title="Brave Websuche">
              <input id="webSearchToggleTop" type="checkbox" />
              🌐
            </label>

            <button id="reloadModelsBtn" class="secondary icon-btn" type="button" title="Modelle laden">↻</button>

            <button id="newChatBtnTop" class="secondary icon-btn desktop-only" type="button" title="Neuer Chat">＋</button>
          </div>
        </div>
      </div>

      <div class="settings-card hidden" id="settingsCard">
        <details class="settings-panel" id="settingsPanel">
          <summary>
            <span>Einstellungen</span>
            <span>▾</span>
          </summary>
          <div class="settings-content">
            <div class="settings-grid">
              <select id="modelSelect"></select>
            </div>

            <div class="settings-grid-2">
              <input id="chatTitleInput" type="text" placeholder="Chat Titel" />
              <button id="renameBtn" class="secondary" type="button">Speichern</button>
              <button id="deleteChatBtn" class="danger" type="button">Löschen</button>
            </div>
          </div>
        </details>
      </div>

      <div class="chat" id="chat"></div>

      <div class="composer">
        <textarea id="prompt" placeholder="Schreibe deine Nachricht…"></textarea>
        <div class="composer-actions">
          <div class="status" id="status">Bereit</div>
          <button id="sendBtn" type="button">Senden</button>
        </div>
      </div>
    </main>
  </div>

  <script>
    const chatEl = document.getElementById("chat");
    const promptEl = document.getElementById("prompt");
    const sendBtn = document.getElementById("sendBtn");
    const statusEl = document.getElementById("status");
    const modelSelectEl = document.getElementById("modelSelect");
    const reloadModelsBtn = document.getElementById("reloadModelsBtn");
    const serverInfoEl = document.getElementById("serverInfo");
    const historyListEl = document.getElementById("historyList");
    const newChatBtn = document.getElementById("newChatBtn");
    const newChatBtnTop = document.getElementById("newChatBtnTop");
    const deleteChatBtn = document.getElementById("deleteChatBtn");
    const chatTitleInput = document.getElementById("chatTitleInput");
    const renameBtn = document.getElementById("renameBtn");
    const searchChatsInput = document.getElementById("searchChatsInput");
    const webSearchToggleTopEl = document.getElementById("webSearchToggleTop");
    const webSearchToggleBtnEl = document.getElementById("webSearchToggleBtn");
    const mobileHistoryToggle = document.getElementById("mobileHistoryToggle");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const settingsCardEl = document.getElementById("settingsCard");
    const toggleSettingsBtnEl = document.getElementById("toggleSettingsBtn");

    const SETTINGS_KEY = "ha_ollama_webapp_settings_v_server_user_2";

    let chats = [];
    let currentChatId = null;
    let busy = false;
    let tempChatId = null;

    function updateWebToggleVisual() {
      webSearchToggleBtnEl.classList.toggle("is-on", webSearchToggleTopEl.checked);
    }

    function updateSettingsVisibility(isVisible) {
      settingsCardEl.classList.toggle("hidden", !isVisible);
      toggleSettingsBtnEl.textContent = isVisible ? "✕" : "⚙";
      toggleSettingsBtnEl.title = isVisible ? "Einstellungen ausblenden" : "Einstellungen einblenden";
    }

    function saveLocalSettings() {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        currentChatId,
        useWebSearch: webSearchToggleTopEl.checked,
        settingsVisible: !settingsCardEl.classList.contains("hidden")
      }));
      updateWebToggleVisual();
    }

    function loadLocalSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        if (typeof settings.currentChatId === "string") {
          currentChatId = settings.currentChatId;
        }
        if (typeof settings.useWebSearch === "boolean") {
          webSearchToggleTopEl.checked = settings.useWebSearch;
        }
        if (typeof settings.settingsVisible === "boolean") {
          updateSettingsVisibility(settings.settingsVisible);
        } else {
          updateSettingsVisibility(false);
        }
      } catch (_) {
        updateSettingsVisibility(false);
      }
      updateWebToggleVisual();
    }

    async function api(path, options = {}) {
      const response = await fetch(path, options);
      let data = {};
      try {
        data = await response.json();
      } catch (_) {}
      if (!response.ok) {
        throw new Error(data.detail || "Unbekannter Fehler");
      }
      return data;
    }

    function currentChat() {
      return chats.find(c => c.id === currentChatId) || chats[0] || null;
    }

    function escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function formatDate(iso) {
      try {
        return new Date(iso).toLocaleString([], {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (_) {
        return "";
      }
    }

    function openSidebar() {
      document.body.classList.add("sidebar-open");
    }

    function closeSidebar() {
      document.body.classList.remove("sidebar-open");
    }

    function maybeCloseSidebarOnMobile() {
      if (window.innerWidth <= 980) {
        closeSidebar();
      }
    }

    function ensureTempChat() {
      let chat = currentChat();
      if (chat) return chat;

      const now = new Date().toISOString();
      const temp = {
        id: "temp_" + Date.now(),
        title: "Neuer Chat",
        created_at: now,
        updated_at: now,
        messages: []
      };
      tempChatId = temp.id;
      chats.unshift(temp);
      currentChatId = temp.id;
      return temp;
    }

    async function deleteChatById(chatId) {
      await api(`./api/chats/${chatId}`, { method: "DELETE" });
      if (currentChatId === chatId) {
        currentChatId = null;
      }
      await loadChats();
    }

    function renderHistoryList() {
      const q = (searchChatsInput.value || "").trim().toLowerCase();
      historyListEl.innerHTML = "";

      const sorted = [...chats].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const filtered = sorted.filter(chat => {
        if (!q) return true;
        const hay = [
          chat.title || "",
          ...(chat.messages || []).map(m => m.content || "")
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });

      for (const chat of filtered) {
        const wrap = document.createElement("div");
        wrap.className = "history-item-wrap";

        const btn = document.createElement("button");
        btn.className = "history-item" + (chat.id === currentChatId ? " active" : "");
        btn.type = "button";

        const lastAssistant = [...(chat.messages || [])].reverse().find(m => m.role === "assistant");
        const preview = lastAssistant?.content || chat.messages?.[0]?.content || "Noch keine Nachrichten";

        btn.innerHTML = `
          <div class="history-title">${escapeHtml(chat.title || "Ohne Titel")}</div>
          <div class="history-sub">${escapeHtml(preview)}</div>
          <div class="history-sub">${escapeHtml(formatDate(chat.updated_at))}</div>
        `;

        btn.addEventListener("click", async () => {
          currentChatId = chat.id;
          renderAll();
          saveLocalSettings();
          maybeCloseSidebarOnMobile();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "history-delete-btn";
        deleteBtn.type = "button";
        deleteBtn.title = "Chat löschen";
        deleteBtn.textContent = "🗑";
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm(`Chat "${chat.title || "Ohne Titel"}" wirklich löschen?`)) return;
          await deleteChatById(chat.id);
        });

        wrap.appendChild(btn);
        wrap.appendChild(deleteBtn);
        historyListEl.appendChild(wrap);
      }
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

      if (msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0) {
        const sources = document.createElement("div");
        sources.className = "sources";

        for (const source of msg.sources) {
          const a = document.createElement("a");
          a.className = "source-chip";
          a.href = source.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = source.title || source.url;
          sources.appendChild(a);
        }

        wrapper.appendChild(sources);
      }

      wrapper.appendChild(meta);
      return wrapper;
    }

    function renderChat() {
      const chat = currentChat();
      chatEl.innerHTML = "";

      if (!chat || !chat.messages || !chat.messages.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.innerHTML = "Noch kein Verlauf.<br>Schreibe deine erste Nachricht.";
        chatEl.appendChild(empty);
        return;
      }

      for (const msg of chat.messages) {
        chatEl.appendChild(renderMessage(msg));
      }

      chatEl.scrollTop = chatEl.scrollHeight;
    }

    function renderHeaderFields() {
      const chat = currentChat();
      chatTitleInput.value = chat?.title || "";
      serverInfoEl.textContent = "Verbunden • 1 Modell";
    }

    function renderAll() {
      renderHistoryList();
      renderHeaderFields();
      renderChat();
      autoResize();
      updateWebToggleVisual();
    }

    async function loadChats() {
      const data = await api("./api/chats");
      chats = Array.isArray(data.chats) ? data.chats : [];
      if (!chats.length) {
        currentChatId = null;
      } else if (!currentChatId || !chats.find(c => c.id === currentChatId)) {
        currentChatId = chats[0].id;
      }
      tempChatId = null;
      renderAll();
      saveLocalSettings();
    }

    async function loadModels() {
      modelSelectEl.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "qwen3.5:397b-cloud";
      opt.textContent = "qwen3.5:397b-cloud";
      modelSelectEl.appendChild(opt);
      modelSelectEl.value = "qwen3.5:397b-cloud";
      renderHeaderFields();
    }

    function processStreamLine(line, assistantMsg) {
      if (!line) return;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch (_) {
        return;
      }

      if (obj.type === "chat_id" && obj.chat_id) {
        currentChatId = obj.chat_id;
        saveLocalSettings();
        return;
      }

      if (obj.type === "token") {
        assistantMsg.content += obj.content || "";
        renderChat();
        return;
      }

      if (obj.type === "sources" && Array.isArray(obj.sources)) {
        assistantMsg.sources = obj.sources;
        renderChat();
        return;
      }

      if (obj.type === "error") {
        throw new Error(obj.detail || "Streaming-Fehler");
      }
    }

    async function sendMessage() {
      if (busy) return;

      const prompt = promptEl.value.trim();
      const model = "qwen3.5:397b-cloud";

      if (!prompt) return;

      const existingChat = currentChat();
      const historyForRequest = (existingChat?.messages || [])
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }));

      const chat = ensureTempChat();
      const userMsg = {
        role: "user",
        content: prompt,
        ts: Date.now()
      };
      const assistantMsg = {
        role: "assistant",
        content: "",
        ts: Date.now(),
        sources: []
      };

      chat.messages.push(userMsg);
      chat.messages.push(assistantMsg);
      chat.updated_at = new Date().toISOString();

      promptEl.value = "";
      autoResize();
      renderAll();

      busy = true;
      sendBtn.disabled = true;
      promptEl.disabled = true;
      statusEl.innerHTML = '<span class="spinner"></span>Antwort wird gestreamt…';

      try {
        const response = await fetch("./api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: existingChat?.id || null,
            model,
            message: prompt,
            use_web_search: webSearchToggleTopEl.checked,
            history: historyForRequest
          })
        });

        if (!response.ok || !response.body) {
          let data = {};
          try {
            data = await response.json();
          } catch (_) {}
          throw new Error(data.detail || "Unbekannter Fehler");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            processStreamLine(line.trim(), assistantMsg);
          }
        }

        if (buffer.trim()) {
          processStreamLine(buffer.trim(), assistantMsg);
        }

        await loadChats();
        statusEl.textContent = "Bereit";
      } catch (err) {
        assistantMsg.content = "Fehler: " + (err.message || "Die Anfrage konnte nicht verarbeitet werden.");
        renderChat();
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
      promptEl.style.height = Math.min(promptEl.scrollHeight, 200) + "px";
    }

    async function newChat() {
      const res = await api("./api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      currentChatId = res.chat?.id || null;
      await loadChats();
      promptEl.focus();
      maybeCloseSidebarOnMobile();
    }

    async function deleteCurrentChat() {
      const chat = currentChat();
      if (!chat) return;
      await deleteChatById(chat.id);
      maybeCloseSidebarOnMobile();
    }

    async function renameCurrentChat() {
      const chat = currentChat();
      const value = chatTitleInput.value.trim();
      if (!chat || !value) return;

      await api(`./api/chats/${chat.id}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value })
      });

      await loadChats();
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
    newChatBtn.addEventListener("click", newChat);
    newChatBtnTop.addEventListener("click", newChat);
    deleteChatBtn.addEventListener("click", async () => {
      const chat = currentChat();
      if (!chat) return;
      if (!confirm(`Chat "${chat.title || "Ohne Titel"}" wirklich löschen?`)) return;
      await deleteCurrentChat();
    });
    renameBtn.addEventListener("click", renameCurrentChat);
    searchChatsInput.addEventListener("input", renderHistoryList);
    webSearchToggleTopEl.addEventListener("change", saveLocalSettings);
    mobileHistoryToggle.addEventListener("click", openSidebar);
    sidebarBackdrop.addEventListener("click", closeSidebar);
    toggleSettingsBtnEl.addEventListener("click", () => {
      const willShow = settingsCardEl.classList.contains("hidden");
      updateSettingsVisibility(willShow);
      saveLocalSettings();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeSidebar();
      }
    });

    async function init() {
      loadLocalSettings();
      updateWebToggleVisual();
      await loadModels();
      await loadChats();
      autoResize();
    }

    init();
  </script>
</body>
</html>
"""


def utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_store_exists() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CHATS_FILE):
        with open(CHATS_FILE, "w", encoding="utf-8") as f:
            json.dump({"users": {}}, f, ensure_ascii=False, indent=2)


def load_store() -> Dict[str, Any]:
    ensure_store_exists()
    with STORE_LOCK:
        try:
            with open(CHATS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                return {"users": {}}
            if not isinstance(data.get("users"), dict):
                data["users"] = {}
            return data
        except Exception:
            return {"users": {}}


def save_store(data: Dict[str, Any]) -> None:
    ensure_store_exists()
    with STORE_LOCK:
        with open(CHATS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def get_user_key(request: Request) -> str:
    candidates = [
        request.headers.get("X-Hass-User-Id"),
        request.headers.get("X-HA-User-ID"),
        request.headers.get("X-Authenticated-User-Id"),
        request.headers.get("Remote-User"),
    ]
    for value in candidates:
        if value and value.strip():
            return value.strip()
    return "anonymous_ingress_user"


def get_user_store(data: Dict[str, Any], user_key: str) -> Dict[str, Any]:
    users = data.setdefault("users", {})
    user_store = users.get(user_key)
    if not isinstance(user_store, dict):
        user_store = {"chats": []}
        users[user_key] = user_store
    if not isinstance(user_store.get("chats"), list):
        user_store["chats"] = []
    return user_store


def make_chat_id() -> str:
    return f"chat_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"


def create_empty_chat() -> Dict[str, Any]:
    now = utc_now_iso()
    return {
        "id": make_chat_id(),
        "title": f"Neuer Chat {datetime.now().strftime('%d.%m.%Y %H:%M')}",
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }


def find_chat(user_store: Dict[str, Any], chat_id: str) -> Optional[Dict[str, Any]]:
    for chat in user_store.get("chats", []):
        if chat.get("id") == chat_id:
            return chat
    return None


def sort_chats(user_store: Dict[str, Any]) -> None:
    user_store["chats"] = sorted(
        user_store.get("chats", []),
        key=lambda c: c.get("updated_at", ""),
        reverse=True,
    )


def append_message(chat: Dict[str, Any], role: str, content: str, sources: Optional[List[Dict[str, Any]]] = None) -> None:
    msg: Dict[str, Any] = {
        "role": role,
        "content": content,
        "ts": int(datetime.now().timestamp() * 1000),
    }
    if sources:
        msg["sources"] = sources
    chat.setdefault("messages", []).append(msg)
    chat["updated_at"] = utc_now_iso()


def maybe_autotitle(chat: Dict[str, Any]) -> None:
    title = str(chat.get("title", ""))
    if not title.startswith("Neuer Chat"):
        return
    for msg in chat.get("messages", []):
        if msg.get("role") == "user" and msg.get("content"):
            chat["title"] = str(msg["content"]).strip()[:40] or title
            return


def auth_headers() -> Dict[str, str]:
    headers: Dict[str, str] = {
        "Accept": "application/json, application/x-ndjson, text/plain, */*"
    }
    if OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"
    return headers


def normalize_keep_alive(value: str) -> Union[int, str]:
    raw = (value or "").strip()
    if not raw:
        return "5m"
    if raw in {"0", "-1"}:
        return int(raw)
    try:
        return int(raw)
    except ValueError:
        return raw


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
            filtered = [m for m in models if isinstance(m, dict) and m.get("name") == DEFAULT_MODEL]
            if filtered:
                return filtered
    return [{"name": DEFAULT_MODEL}]


def extract_chunk_from_obj(obj: Dict[str, Any]) -> str:
    message = obj.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content

    response = obj.get("response")
    if isinstance(response, str):
        return response

    content = obj.get("content")
    if isinstance(content, str):
        return content

    return ""


async def fetch_json_or_text(
    method: str,
    url: str,
    json_body: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Any:
    merged_headers = dict(headers or {})
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, headers=merged_headers) as client:
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
    data = await fetch_json_or_text(
        "GET",
        f"{OLLAMA_BASE_URL}/tags",
        headers=auth_headers(),
    )
    return extract_models(data)


async def brave_search(query: str) -> List[SearchSource]:
    if not BRAVE_API_KEY:
        return []

    params = {
        "q": query,
        "count": min(max(BRAVE_RESULT_COUNT, 1), 20),
        "country": BRAVE_COUNTRY,
        "search_lang": BRAVE_SEARCH_LANG,
        "safesearch": "moderate",
        "text_decorations": False,
        "spellcheck": True,
    }

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, headers=headers) as client:
        resp = await client.get("https://api.search.brave.com/res/v1/web/search", params=params)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("web", {}).get("results", [])
    sources: List[SearchSource] = []

    for item in results[:BRAVE_RESULT_COUNT]:
        url = item.get("url") or ""
        title = item.get("title") or url
        description = item.get("description") or item.get("snippet") or ""
        if not url:
            continue
        sources.append(SearchSource(title=title, url=url, description=description))
    return sources


def build_web_context(sources: List[SearchSource]) -> str:
    if not sources:
        return "Keine Websuchergebnisse gefunden."

    parts: List[str] = []
    for idx, source in enumerate(sources, start=1):
        parts.append(
            f"[Quelle {idx}]\n"
            f"Titel: {source.title}\n"
            f"URL: {source.url}\n"
            f"Beschreibung: {source.description or 'Keine Beschreibung verfügbar.'}"
        )
    return "\n\n".join(parts)


async def stream_upstream_chat(messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
    payload = {
        "model": DEFAULT_MODEL,
        "messages": messages,
        "stream": True,
        "keep_alive": normalize_keep_alive(DEFAULT_KEEP_ALIVE),
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, headers=auth_headers()) as client:
        async with client.stream("POST", f"{OLLAMA_BASE_URL}/chat", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                chunk = extract_chunk_from_obj(obj)
                if chunk:
                    yield chunk


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(INDEX_HTML)


@app.get("/api/models")
async def models() -> Dict[str, Any]:
    try:
        await fetch_models()
        return {"models": [{"name": DEFAULT_MODEL}], "default_model": DEFAULT_MODEL}
    except Exception:
        return {"models": [{"name": DEFAULT_MODEL}], "default_model": DEFAULT_MODEL}


@app.get("/api/chats")
async def get_chats(request: Request) -> Dict[str, Any]:
    user_key = get_user_key(request)
    data = load_store()
    user_store = get_user_store(data, user_key)
    sort_chats(user_store)
    return {"chats": user_store.get("chats", [])}


@app.post("/api/chats")
async def create_chat(request: Request) -> Dict[str, Any]:
    user_key = get_user_key(request)
    data = load_store()
    user_store = get_user_store(data, user_key)
    chat = create_empty_chat()
    user_store.setdefault("chats", []).insert(0, chat)
    sort_chats(user_store)
    save_store(data)
    return {"chat": chat}


@app.patch("/api/chats/{chat_id}/rename")
async def rename_chat(chat_id: str, req: ChatRenameRequest, request: Request) -> Dict[str, Any]:
    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Leerer Titel.")

    user_key = get_user_key(request)
    data = load_store()
    user_store = get_user_store(data, user_key)
    chat = find_chat(user_store, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat nicht gefunden.")

    chat["title"] = title
    chat["updated_at"] = utc_now_iso()
    sort_chats(user_store)
    save_store(data)
    return {"chat": chat}


@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str, request: Request) -> Dict[str, Any]:
    user_key = get_user_key(request)
    data = load_store()
    user_store = get_user_store(data, user_key)
    chats = user_store.get("chats", [])
    new_chats = [c for c in chats if c.get("id") != chat_id]
    user_store["chats"] = new_chats

    if not new_chats:
        user_store["chats"] = [create_empty_chat()]

    sort_chats(user_store)
    save_store(data)
    return {"ok": True, "chats": user_store["chats"]}


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    user_message = req.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Leere Nachricht.")

    user_key = get_user_key(request)
    data = load_store()
    user_store = get_user_store(data, user_key)

    chat_obj: Optional[Dict[str, Any]] = None
    if req.chat_id:
        chat_obj = find_chat(user_store, req.chat_id)

    if not chat_obj:
        chat_obj = create_empty_chat()
        user_store.setdefault("chats", []).insert(0, chat_obj)

    append_message(chat_obj, "user", user_message)
    maybe_autotitle(chat_obj)
    sort_chats(user_store)
    save_store(data)

    history = sanitize_history(req.history, limit=12)
    sources: List[SearchSource] = []

    user_content = user_message
    if req.use_web_search:
        sources = await brave_search(user_message)
        if sources:
            user_content = (
                f"Frage:\n{user_message}\n\n"
                f"Websuchquellen:\n{build_web_context(sources)}\n\n"
                "Nutze die Websuchquellen nur zur Stützung aktueller Fakten."
            )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": user_content},
    ]

    async def event_stream() -> AsyncGenerator[bytes, None]:
        assistant_text = ""
        try:
            yield (json.dumps({"type": "chat_id", "chat_id": chat_obj["id"]}, ensure_ascii=False) + "\n").encode("utf-8")

            if sources:
                yield (
                    json.dumps(
                        {"type": "sources", "sources": [s.model_dump() for s in sources]},
                        ensure_ascii=False,
                    ) + "\n"
                ).encode("utf-8")

            async for chunk in stream_upstream_chat(messages):
                assistant_text += chunk
                yield (json.dumps({"type": "token", "content": chunk}, ensure_ascii=False) + "\n").encode("utf-8")

            append_message(
                chat_obj,
                "assistant",
                assistant_text.strip(),
                sources=[s.model_dump() for s in sources] if sources else None,
            )
            maybe_autotitle(chat_obj)

            fresh = load_store()
            fresh_user_store = get_user_store(fresh, user_key)
            stored_chat = find_chat(fresh_user_store, chat_obj["id"])
            if stored_chat is None:
                fresh_user_store.setdefault("chats", []).insert(0, chat_obj)
            else:
                stored_chat.update(chat_obj)
            sort_chats(fresh_user_store)
            save_store(fresh)

            yield (json.dumps({"type": "done"}, ensure_ascii=False) + "\n").encode("utf-8")

        except httpx.RequestError as exc:
            error_text = f"Fehler: Netzwerkfehler: {exc}"
            append_message(chat_obj, "assistant", error_text)
            fresh = load_store()
            fresh_user_store = get_user_store(fresh, user_key)
            stored_chat = find_chat(fresh_user_store, chat_obj["id"])
            if stored_chat is None:
                fresh_user_store.setdefault("chats", []).insert(0, chat_obj)
            else:
                stored_chat.update(chat_obj)
            sort_chats(fresh_user_store)
            save_store(fresh)
            yield (json.dumps({"type": "error", "detail": str(exc)}, ensure_ascii=False) + "\n").encode("utf-8")

        except Exception as exc:
            error_text = f"Fehler: Interner Fehler: {exc}"
            append_message(chat_obj, "assistant", error_text)
            fresh = load_store()
            fresh_user_store = get_user_store(fresh, user_key)
            stored_chat = find_chat(fresh_user_store, chat_obj["id"])
            if stored_chat is None:
                fresh_user_store.setdefault("chats", []).insert(0, chat_obj)
            else:
                stored_chat.update(chat_obj)
            sort_chats(fresh_user_store)
            save_store(fresh)
            yield (json.dumps({"type": "error", "detail": str(exc)}, ensure_ascii=False) + "\n").encode("utf-8")

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
