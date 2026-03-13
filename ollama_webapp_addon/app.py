import json
import os
from typing import Any, Dict, List, Optional, Union

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
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
      --panel-3: #0f141d;
      --text: #eef3fb;
      --muted: #9fb0c7;
      --accent: #4fd1c5;
      --accent-2: #2c7a7b;
      --danger: #ff6b6b;
      --border: rgba(255,255,255,.08);
      --shadow: 0 10px 30px rgba(0,0,0,.28);
      --radius: 20px;
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
      min-height: 100%;
    }

    body {
      min-height: 100dvh;
      overflow-x: hidden;
    }

    .mobile-sidebar-backdrop {
      display: none;
    }

    .layout {
      max-width: 1320px;
      margin: 0 auto;
      min-height: 100dvh;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 14px;
      padding: calc(var(--safe-top) + 12px) 12px calc(var(--safe-bottom) + 12px) 12px;
    }

    .sidebar {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(11, 15, 20, 0.88);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
      padding: 12px;
      display: grid;
      grid-template-rows: auto auto 1fr;
      gap: 10px;
      min-height: calc(100dvh - 24px - var(--safe-top) - var(--safe-bottom));
      position: sticky;
      top: calc(var(--safe-top) + 12px);
      overflow: hidden;
      min-width: 0;
    }

    .sidebar-header {
      display: grid;
      gap: 10px;
    }

    .app {
      min-height: calc(100dvh - 24px - var(--safe-top) - var(--safe-bottom));
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 10px;
      min-width: 0;
    }

    .topbar {
      position: sticky;
      top: calc(var(--safe-top) + 12px);
      z-index: 20;
      background: rgba(11, 15, 20, 0.88);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 10px 12px;
    }

    .topbar-row {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      gap: 8px;
      align-items: center;
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
      background: rgba(11, 15, 20, 0.88);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
      padding: 10px;
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

    .history-item {
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      border-radius: 14px;
      padding: 10px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: border-color .15s ease, transform .15s ease;
    }

    .history-item:active {
      transform: scale(0.995);
    }

    .history-item.active {
      border-color: rgba(79, 209, 197, 0.45);
      box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.12);
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
      border-radius: 14px;
      background: var(--panel);
      color: var(--text);
      padding: 11px 12px;
      font-size: 16px;
      outline: none;
      min-height: 44px;
    }

    select:focus, textarea:focus, input[type="text"]:focus {
      border-color: rgba(79, 209, 197, 0.55);
      box-shadow: 0 0 0 4px rgba(79, 209, 197, 0.14);
    }

    button {
      cursor: pointer;
      font-weight: 650;
      background: linear-gradient(180deg, var(--accent), var(--accent-2));
      color: #071014;
      border: none;
      min-height: 44px;
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
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--panel);
      min-height: 44px;
      user-select: none;
      white-space: nowrap;
      width: auto;
      min-width: 44px;
      justify-content: center;
    }

    .toggle.compact span {
      display: none;
    }

    .toggle input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      flex: 0 0 auto;
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
      overflow: auto;
      padding: 2px;
      min-height: 0;
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
      border-radius: 999px;
      font-size: 13px;
      max-width: 100%;
    }

    .composer {
      position: sticky;
      bottom: calc(var(--safe-bottom) + 12px);
      background: rgba(11,15,20,.9);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 10px;
      z-index: 15;
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
        grid-template-rows: auto auto 1fr auto;
      }

      .topbar {
        top: calc(var(--safe-top) + 8px);
        padding: 10px;
      }

      .topbar-row {
        grid-template-columns: auto 1fr auto auto;
      }

      .composer {
        bottom: calc(var(--safe-bottom) + 8px);
        padding: 10px;
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
        border-radius: 14px;
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

      .icon-btn {
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
          <label class="toggle compact" title="Brave Websuche">
            <input id="webSearchToggleTop" type="checkbox" />
            <span>Websuche</span>
          </label>
          <button id="reloadModelsBtn" class="secondary icon-btn" type="button" title="Modelle laden">↻</button>
          <button id="newChatBtnTop" class="secondary icon-btn desktop-only" type="button" title="Neuer Chat">＋</button>
        </div>
      </div>

      <div class="settings-card">
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
    const mobileHistoryToggle = document.getElementById("mobileHistoryToggle");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    const CHATS_KEY = "ha_ollama_webapp_chats_v2";
    const SETTINGS_KEY = "ha_ollama_webapp_settings_v10";

    let chats = [];
    let currentChatId = null;
    let busy = false;

    function uid() {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function defaultTitle() {
      const d = new Date();
      return "Neuer Chat " + d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function createEmptyChat() {
      return {
        id: uid(),
        title: defaultTitle(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        messages: []
      };
    }

    function saveState() {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        currentChatId,
        useWebSearch: webSearchToggleTopEl.checked
      }));
    }

    function loadState() {
      try {
        const savedChats = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
        if (Array.isArray(savedChats) && savedChats.length) {
          chats = savedChats;
        }
      } catch (_) {}

      if (!chats.length) {
        chats = [createEmptyChat()];
      }

      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        if (typeof settings.currentChatId === "string") {
          currentChatId = settings.currentChatId;
        }
        if (typeof settings.useWebSearch === "boolean") {
          webSearchToggleTopEl.checked = settings.useWebSearch;
        }
      } catch (_) {}

      if (!currentChatId || !chats.find(c => c.id === currentChatId)) {
        currentChatId = chats[0].id;
      }
    }

    function currentChat() {
      return chats.find(c => c.id === currentChatId) || chats[0];
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

    function renderHistoryList() {
      const q = (searchChatsInput.value || "").trim().toLowerCase();
      historyListEl.innerHTML = "";

      const sorted = [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const filtered = sorted.filter(chat => {
        if (!q) return true;
        const hay = [
          chat.title || "",
          ...(chat.messages || []).map(m => m.content || "")
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });

      for (const chat of filtered) {
        const btn = document.createElement("button");
        btn.className = "history-item" + (chat.id === currentChatId ? " active" : "");
        btn.type = "button";

        const lastAssistant = [...(chat.messages || [])].reverse().find(m => m.role === "assistant");
        const preview = lastAssistant?.content || chat.messages?.[0]?.content || "Noch keine Nachrichten";

        btn.innerHTML = `
          <div class="history-title">${escapeHtml(chat.title || "Ohne Titel")}</div>
          <div class="history-sub">${escapeHtml(preview)}</div>
          <div class="history-sub">${escapeHtml(formatDate(chat.updatedAt))}</div>
        `;

        btn.addEventListener("click", () => {
          currentChatId = chat.id;
          renderAll();
          saveState();
          maybeCloseSidebarOnMobile();
        });

        historyListEl.appendChild(btn);
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

      if (!chat.messages || !chat.messages.length) {
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
      chatTitleInput.value = chat.title || "";
      const modelCount = modelSelectEl.options.length || 0;
      serverInfoEl.textContent = modelCount ? `Verbunden • ${modelCount} Modell(e)` : "Verbunden";
    }

    function renderAll() {
      renderHistoryList();
      renderHeaderFields();
      renderChat();
      autoResize();
    }

    function ensureAutoTitle(chat) {
      if (!chat || !chat.messages || !chat.messages.length) return;
      const firstUser = chat.messages.find(m => m.role === "user" && m.content);
      if (!firstUser) return;

      if ((chat.title || "").startsWith("Neuer Chat")) {
        chat.title = firstUser.content.trim().slice(0, 40) || chat.title;
      }
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

        modelSelectEl.value = "qwen3.5:397b-cloud";
        renderHeaderFields();
        saveState();
      } catch (err) {
        serverInfoEl.textContent = "Verbindung fehlgeschlagen";
        alert("Modelle konnten nicht geladen werden. Prüfe API-Key, Brave-Key, Add-on-Log und Base URL.");
      }
    }

    async function sendMessage() {
      if (busy) return;

      const prompt = promptEl.value.trim();
      const model = "qwen3.5:397b-cloud";
      const chat = currentChat();

      if (!prompt) return;

      busy = true;
      sendBtn.disabled = true;
      promptEl.disabled = true;
      statusEl.innerHTML = '<span class="spinner"></span>Sende Anfrage…';

      const userMsg = {
        role: "user",
        content: prompt,
        ts: Date.now()
      };

      chat.messages.push(userMsg);
      chat.updatedAt = nowIso();
      ensureAutoTitle(chat);
      renderAll();
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
            use_web_search: webSearchToggleTopEl.checked,
            history: chat.messages
              .filter(m => m.role === "user" || m.role === "assistant")
              .slice(-12)
              .map(m => ({ role: m.role, content: m.content }))
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Unbekannter Fehler");
        }

        chat.messages.push({
          role: "assistant",
          content: data.answer || "Keine Antwort erhalten.",
          sources: data.sources || [],
          ts: Date.now()
        });
        chat.updatedAt = nowIso();

        renderAll();
        saveState();
        statusEl.textContent = "Bereit";
      } catch (err) {
        chat.messages.push({
          role: "assistant",
          content: "Fehler: " + (err.message || "Die Anfrage konnte nicht verarbeitet werden."),
          ts: Date.now()
        });
        chat.updatedAt = nowIso();

        renderAll();
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
      promptEl.style.height = Math.min(promptEl.scrollHeight, 200) + "px";
    }

    function newChat() {
      const chat = createEmptyChat();
      chats.unshift(chat);
      currentChatId = chat.id;
      renderAll();
      saveState();
      promptEl.focus();
      maybeCloseSidebarOnMobile();
    }

    function deleteCurrentChat() {
      if (chats.length === 1) {
        chats = [createEmptyChat()];
        currentChatId = chats[0].id;
      } else {
        chats = chats.filter(c => c.id !== currentChatId);
        currentChatId = chats[0].id;
      }
      renderAll();
      saveState();
      maybeCloseSidebarOnMobile();
    }

    function renameCurrentChat() {
      const chat = currentChat();
      const value = chatTitleInput.value.trim();
      if (!value) return;
      chat.title = value;
      chat.updatedAt = nowIso();
      renderAll();
      saveState();
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
    deleteChatBtn.addEventListener("click", () => {
      if (!confirm("Diesen Chat wirklich löschen?")) return;
      deleteCurrentChat();
    });
    renameBtn.addEventListener("click", renameCurrentChat);
    searchChatsInput.addEventListener("input", renderHistoryList);
    webSearchToggleTopEl.addEventListener("change", saveState);
    mobileHistoryToggle.addEventListener("click", openSidebar);
    sidebarBackdrop.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeSidebar();
      }
    });

    loadState();
    renderAll();
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
Wenn Websuchquellen vorhanden sind, nutze sie nur zur Stützung aktueller Fakten und nenne sie knapp.
Verwende saubere Absätze statt unnötig vieler Listen.
"""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    message: str
    use_web_search: bool = False
    history: List[ChatMessage] = []

class SearchSource(BaseModel):
    title: str
    url: str
    description: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SearchSource] = []

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
        sources.append(
            SearchSource(
                title=title,
                url=url,
                description=description,
            )
        )
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
        "model": DEFAULT_MODEL,
        "messages": messages,
        "stream": False,
        "keep_alive": normalize_keep_alive(DEFAULT_KEEP_ALIVE),
    }
    data = await fetch_json_or_text(
        "POST",
        f"{OLLAMA_BASE_URL}/chat",
        json_body=payload,
        headers=auth_headers(),
    )
    return extract_text_from_response(data)

async def try_generate_endpoint(model: str, messages: List[Dict[str, str]], user_message: str) -> Optional[str]:
    prompt = history_to_prompt(messages, user_message)
    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "keep_alive": normalize_keep_alive(DEFAULT_KEEP_ALIVE),
    }
    data = await fetch_json_or_text(
        "POST",
        f"{OLLAMA_BASE_URL}/generate",
        json_body=payload,
        headers=auth_headers(),
    )
    return extract_text_from_response(data)

async def ask_upstream(model: str, messages: List[Dict[str, str]], user_message: str) -> str:
    attempts: List[str] = []

    for label, func in [
        ("chat", lambda: try_chat_endpoint(model, messages)),
        ("generate", lambda: try_generate_endpoint(model, messages, user_message)),
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

    raise HTTPException(status_code=502, detail=" | ".join(attempts)[:1500])

@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(INDEX_HTML)

@app.get("/api/models")
async def models() -> Dict[str, Any]:
    try:
        models = await fetch_models()
        return {
            "models": [{"name": DEFAULT_MODEL}],
            "default_model": DEFAULT_MODEL,
        }
    except Exception:
        return {
            "models": [{"name": DEFAULT_MODEL}],
            "default_model": DEFAULT_MODEL,
        }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    user_message = req.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Leere Nachricht.")

    history = sanitize_history(req.history, limit=12)
    sources: List[SearchSource] = []

    try:
        system_content = SYSTEM_PROMPT

        if req.use_web_search:
            sources = await brave_search(user_message)
            if sources:
                system_content = (
                    SYSTEM_PROMPT
                    + "\n\nNutze die folgenden Websuchquellen nur zur Stützung aktueller Fakten.\n"
                    + build_web_context(sources)
                )

        messages = [
            {"role": "system", "content": system_content},
            *history[:-1],
            {"role": "user", "content": user_message},
        ]
        answer = await ask_upstream(DEFAULT_MODEL, messages, user_message)
        return ChatResponse(answer=answer, sources=sources)

    except HTTPException:
        raise
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Netzwerkfehler: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interner Fehler: {exc}") from exc
