const state = {
  config: {},
  data: { profile: {}, entries: [] },
  pin: localStorage.getItem("kindgesund_pin") || "",
  filters: { search: "", from: "", to: "" }
};

const $ = (id) => document.getElementById(id);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (state.pin) h["x-kindgesund-pin"] = state.pin;
  return h;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    showPin();
    throw new Error("PIN erforderlich oder falsch.");
  }

  if (!res.ok) {
    let message = `Fehler ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2600);
}

function showPin(error = "") {
  $("pinOverlay").classList.remove("hidden");
  $("pinError").textContent = error;
  setTimeout(() => $("pinInput").focus(), 100);
}

function hidePin() {
  $("pinOverlay").classList.add("hidden");
  $("pinInput").value = "";
  $("pinError").textContent = "";
}

async function loadConfig() {
  state.config = await api("./api/config", { headers: {} });
  $("appTitle").textContent = state.config.app_title || "KindGesund";
  document.title = state.config.app_title || "KindGesund";
  if (state.config.pin_required && !state.pin) showPin();
}

async function loadState() {
  state.data = await api("./api/state");
  renderAll();
}

function renderAll() {
  renderProfile();
  renderDashboard();
  renderTimeline();
}

function renderProfile() {
  const profile = state.data.profile || {};
  const name = profile.child_name || state.config.child_name || "Kind";
  $("childNameHero").textContent = name;
  $("profileName").value = name;
  $("profileBirthDate").value = profile.birth_date || "";
  $("profileNotes").value = profile.notes || "";
}

function feverBadge(temp) {
  if (temp === null || temp === undefined || temp === "") return "";
  const high = Number(state.config.high_fever_threshold ?? 39.5);
  const fever = Number(state.config.fever_threshold ?? 38.5);
  const val = Number(temp);
  if (Number.isNaN(val)) return "";
  if (val >= high) return "danger";
  if (val >= fever) return "warning";
  return "";
}

function formatDate(date, time) {
  if (!date) return "Ohne Datum";
  const d = new Date(`${date}T${time || "12:00"}`);
  const dateText = d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  return time ? `${dateText}, ${time} Uhr` : dateText;
}

function entrySearchText(entry) {
  return [
    entry.date, entry.time, entry.temperature, entry.mood,
    ...(entry.symptoms || []),
    entry.custom_symptoms, entry.medication, entry.food,
    entry.sleep, entry.diaper_or_toilet, entry.notes
  ].join(" ").toLowerCase();
}

function filteredEntries() {
  const q = state.filters.search.trim().toLowerCase();
  return [...(state.data.entries || [])].filter(entry => {
    if (state.filters.from && entry.date < state.filters.from) return false;
    if (state.filters.to && entry.date > state.filters.to) return false;
    if (q && !entrySearchText(entry).includes(q)) return false;
    return true;
  });
}

function renderDashboard() {
  const entries = state.data.entries || [];
  $("statEntries").textContent = String(entries.length);

  const lastWithTemp = entries.find(e => e.temperature !== null && e.temperature !== undefined && e.temperature !== "");
  $("statTemp").textContent = lastWithTemp ? `${Number(lastWithTemp.temperature).toFixed(1)} °C` : "Keine";

  const todaysFluids = entries
    .filter(e => e.date === today())
    .reduce((sum, e) => sum + (Number(e.fluids_ml) || 0), 0);
  $("statFluids").textContent = `${todaysFluids} ml`;

  const counts = {};
  entries.forEach(e => (e.symptoms || []).forEach(s => counts[s] = (counts[s] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s).join(", ");
  $("statSymptoms").textContent = top || "Keine";

  $("lastEntryText").textContent = entries[0] ? `Letzter Eintrag: ${formatDate(entries[0].date, entries[0].time)}` : "Noch keine Einträge";

  const recent = entries.slice(0, 3);
  const container = $("recentEntries");
  if (!recent.length) {
    container.className = "cards-list empty-state";
    container.textContent = "Noch keine Einträge vorhanden.";
    return;
  }
  container.className = "cards-list";
  container.innerHTML = recent.map(renderEntryCard).join("");
  bindEntryButtons(container);
}

function renderEntryCard(entry) {
  const symptoms = [...(entry.symptoms || [])];
  if (entry.custom_symptoms) symptoms.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));

  const tempClass = feverBadge(entry.temperature);
  const tempBadge = entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== ""
    ? `<span class="badge ${tempClass}">${Number(entry.temperature).toFixed(1)} °C</span>`
    : "";

  const bodyParts = [
    entry.mood ? `Stimmung: ${escapeHtml(entry.mood)}` : "",
    entry.medication ? `Medikamente: ${escapeHtml(entry.medication)}` : "",
    entry.fluids_ml ? `Flüssigkeit: ${escapeHtml(String(entry.fluids_ml))} ml` : "",
    entry.food ? `Essen: ${escapeHtml(entry.food)}` : "",
    entry.sleep ? `Schlaf: ${escapeHtml(entry.sleep)}` : "",
    entry.diaper_or_toilet ? `Windel / Toilette: ${escapeHtml(entry.diaper_or_toilet)}` : "",
    entry.notes ? `Notizen: ${escapeHtml(entry.notes)}` : ""
  ].filter(Boolean).join("\n");

  return `
    <article class="entry-card" data-id="${entry.id}">
      <div class="entry-top">
        <div>
          <div class="entry-date">${escapeHtml(formatDate(entry.date, entry.time))}</div>
          <div class="entry-meta">${escapeHtml(entry.mood || "Keine Stimmung gewählt")}</div>
        </div>
        <div class="badges">${tempBadge}</div>
      </div>
      ${symptoms.length ? `<div class="badges">${symptoms.map(s => `<span class="badge">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
      ${bodyParts ? `<div class="entry-body">${bodyParts}</div>` : ""}
      <div class="entry-actions">
        <button class="secondary edit-entry" data-id="${entry.id}">Bearbeiten</button>
        <button class="danger-button delete-entry" data-id="${entry.id}">Löschen</button>
      </div>
    </article>
  `;
}

function renderTimeline() {
  const entries = filteredEntries();
  const container = $("timelineList");
  if (!entries.length) {
    container.className = "timeline empty-state";
    container.textContent = "Keine passenden Einträge gefunden.";
    return;
  }
  container.className = "timeline";
  container.innerHTML = entries.map(renderEntryCard).join("");
  bindEntryButtons(container);
}

function bindEntryButtons(container) {
  container.querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.dataset.id));
  });
  container.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetEntryForm() {
  $("entryId").value = "";
  $("entryFormTitle").textContent = "Neuer Eintrag";
  $("date").value = today();
  $("time").value = nowTime();
  $("temperature").value = "";
  $("mood").value = "";
  $("customSymptoms").value = "";
  $("medication").value = "";
  $("fluidsMl").value = "";
  $("food").value = "";
  $("sleep").value = "";
  $("diaperOrToilet").value = "";
  $("notes").value = "";
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = false);
}

function selectedSymptoms() {
  return [...document.querySelectorAll("#symptomChips input:checked")].map(i => i.value);
}

function formEntry() {
  const temp = $("temperature").value;
  const fluids = $("fluidsMl").value;
  return {
    date: $("date").value,
    time: $("time").value,
    temperature: temp === "" ? null : Number(temp),
    mood: $("mood").value,
    symptoms: selectedSymptoms(),
    custom_symptoms: $("customSymptoms").value.trim(),
    medication: $("medication").value.trim(),
    fluids_ml: fluids === "" ? null : Number(fluids),
    food: $("food").value.trim(),
    sleep: $("sleep").value.trim(),
    diaper_or_toilet: $("diaperOrToilet").value.trim(),
    notes: $("notes").value.trim()
  };
}

function editEntry(id) {
  const entry = (state.data.entries || []).find(e => e.id === id);
  if (!entry) return;
  showTab("entry");
  $("entryId").value = entry.id;
  $("entryFormTitle").textContent = "Eintrag bearbeiten";
  $("date").value = entry.date || today();
  $("time").value = entry.time || "";
  $("temperature").value = entry.temperature ?? "";
  $("mood").value = entry.mood || "";
  $("customSymptoms").value = entry.custom_symptoms || "";
  $("medication").value = entry.medication || "";
  $("fluidsMl").value = entry.fluids_ml ?? "";
  $("food").value = entry.food || "";
  $("sleep").value = entry.sleep || "";
  $("diaperOrToilet").value = entry.diaper_or_toilet || "";
  $("notes").value = entry.notes || "";
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = (entry.symptoms || []).includes(i.value));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteEntry(id) {
  if (!confirm("Diesen Eintrag wirklich löschen?")) return;
  await api(`./api/entries/${id}`, { method: "DELETE" });
  await loadState();
  showToast("Eintrag gelöscht.");
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === name));
}

async function init() {
  $("date").value = today();
  $("time").value = nowTime();

  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => showTab(tab.dataset.tab)));
  document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.go)));

  $("pinButton").addEventListener("click", async () => {
    state.pin = $("pinInput").value;
    localStorage.setItem("kindgesund_pin", state.pin);
    try {
      await loadState();
      hidePin();
    } catch (err) {
      localStorage.removeItem("kindgesund_pin");
      state.pin = "";
      showPin(err.message);
    }
  });

  $("pinInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("pinButton").click();
  });

  $("entryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("entryId").value;
    const payload = formEntry();
    if (id) {
      await api(`./api/entries/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Eintrag aktualisiert.");
    } else {
      await api("./api/entries", { method: "POST", body: JSON.stringify(payload) });
      showToast("Eintrag gespeichert.");
    }
    resetEntryForm();
    await loadState();
    showTab("dashboard");
  });

  $("resetEntryButton").addEventListener("click", resetEntryForm);

  $("saveProfileButton").addEventListener("click", async () => {
    const payload = {
      child_name: $("profileName").value.trim() || "Kind",
      birth_date: $("profileBirthDate").value,
      notes: $("profileNotes").value.trim()
    };
    await api("./api/profile", { method: "PUT", body: JSON.stringify(payload) });
    await loadState();
    showToast("Profil gespeichert.");
  });

  $("searchInput").addEventListener("input", e => {
    state.filters.search = e.target.value;
    renderTimeline();
  });
  $("fromDate").addEventListener("change", e => {
    state.filters.from = e.target.value;
    renderTimeline();
  });
  $("toDate").addEventListener("change", e => {
    state.filters.to = e.target.value;
    renderTimeline();
  });
  $("clearFilters").addEventListener("click", () => {
    state.filters = { search: "", from: "", to: "" };
    $("searchInput").value = "";
    $("fromDate").value = "";
    $("toDate").value = "";
    renderTimeline();
  });

  $("importFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Import überschreibt die aktuellen Daten. Fortfahren?")) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await api("./api/import", { method: "POST", body: JSON.stringify(data) });
    await loadState();
    showToast("Import abgeschlossen.");
    event.target.value = "";
  });

  try {
    await loadConfig();
    if (!state.config.pin_required || state.pin) await loadState();
  } catch (err) {
    if (String(err.message).includes("PIN")) showPin(err.message);
    else showToast(err.message);
  }
}

init();
