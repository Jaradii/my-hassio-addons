const state = {
  config: {},
  data: { profile: {}, entries: [] },
  pin: localStorage.getItem("kindgesund_pin") || "",
  selectedDate: today(),
  editingExistingEntry: false
};

const $ = (id) => document.getElementById(id);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

  return res.json();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
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
  document.body.classList.toggle("dark", Boolean(state.config.dark_mode));
  if (state.config.pin_required && !state.pin) showPin();
}

async function loadState() {
  state.data = await api("./api/state");
  renderAll();
}

function renderAll() {
  renderProfile();
  renderDay();
}

function renderProfile() {
  const profile = state.data.profile || {};
  const name = profile.child_name || state.config.child_name || "Kind";
  $("childNameHero").textContent = name;
  $("profileName").value = name;
  $("profileBirthDate").value = profile.birth_date || "";
  $("profileNotes").value = profile.notes || "";
}

function selectedEntries() {
  return (state.data.entries || [])
    .filter(e => e.date === state.selectedDate)
    .sort((a, b) => (b.time || "").localeCompare(a.time || ""));
}

function renderDateHeader(entries) {
  $("selectedDate").value = state.selectedDate;

  const d = new Date(`${state.selectedDate}T12:00:00`);
  const isToday = state.selectedDate === today();
  $("prettyDate").textContent = isToday
    ? "Heute"
    : d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });

  $("daySummary").textContent = entries.length
    ? `${entries.length} Eintrag${entries.length === 1 ? "" : "e"} an diesem Tag`
    : "Noch kein Eintrag";
}

function renderDay() {
  const entries = selectedEntries();
  renderDateHeader(entries);

  const container = $("dayEntries");
  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-day">
        <div>
          <div class="empty-icon">＋</div>
          <h2>Noch nichts eingetragen</h2>
          <p>Tippe unten auf „Neuer Eintrag“, um den aktuellen Zustand für diesen Tag zu speichern.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(renderEntryCard).join("");
  container.querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.dataset.id));
  });
}

function feverClass(temp) {
  if (temp === null || temp === undefined || temp === "") return "";
  const high = Number(state.config.high_fever_threshold ?? 39.5);
  const fever = Number(state.config.fever_threshold ?? 38.5);
  const value = Number(temp);
  if (Number.isNaN(value)) return "";
  if (value >= high) return "high";
  if (value >= fever) return "warn";
  return "";
}

function renderEntryCard(entry) {
  const symptoms = [...(entry.symptoms || [])];
  if (entry.custom_symptoms) symptoms.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));

  const title = entry.mood || symptoms[0] || entry.notes || "Eintrag";
  const temp = entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== ""
    ? `<div class="temp-pill ${feverClass(entry.temperature)}">${Number(entry.temperature).toFixed(1)}°</div>`
    : "";

  const noteParts = [
    entry.medication ? `Medikamente: ${escapeHtml(entry.medication)}` : "",
    entry.food ? `Essen: ${escapeHtml(entry.food)}` : "",
    entry.sleep ? `Schlaf: ${escapeHtml(entry.sleep)}` : "",
    entry.diaper_or_toilet ? `Windel / Toilette: ${escapeHtml(entry.diaper_or_toilet)}` : "",
    entry.notes ? `${escapeHtml(entry.notes)}` : ""
  ].filter(Boolean);

  return `
    <article class="entry-card">
      <div class="entry-card-head">
        <div>
          <span class="entry-time">${escapeHtml(entry.time || "")} Uhr</span>
          <div class="entry-title">${escapeHtml(String(title).slice(0, 70))}</div>
        </div>
        ${temp}
      </div>

      <div class="metric-grid">
        <div class="metric"><span>Stimmung</span><strong>${escapeHtml(entry.mood || "Keine")}</strong></div>
        <div class="metric"><span>Flüssigkeit</span><strong>${entry.fluids_ml ? `${escapeHtml(entry.fluids_ml)} ml` : "Keine"}</strong></div>
        <div class="metric"><span>Symptome</span><strong>${symptoms.length || "Keine"}</strong></div>
      </div>

      ${symptoms.length ? `<div class="tags">${symptoms.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
      ${noteParts.length ? `<div class="note-block">${noteParts.join("\n")}</div>` : ""}

      <div class="card-actions">
        <button class="btn secondary edit-entry" data-id="${entry.id}">Bearbeiten</button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openSheet() {
  document.body.classList.add("sheet-open");
  $("entrySheet").classList.remove("hidden");
  $("entrySheet").setAttribute("aria-hidden", "false");
}

function closeSheet() {
  $("entrySheet").classList.add("hidden");
  $("entrySheet").setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");
  resetEntryForm();
}

function resetEntryForm() {
  state.editingExistingEntry = false;
  $("entryId").value = "";
  $("time").value = "";
  $("entryFormTitle").textContent = "Neuer Eintrag";
  $("autoTimeText").textContent = "Uhrzeit wird automatisch gespeichert";
  $("temperature").value = "";
  $("mood").value = "";
  $("fluidsMl").value = "";
  $("customSymptoms").value = "";
  $("medication").value = "";
  $("food").value = "";
  $("sleep").value = "";
  $("diaperOrToilet").value = "";
  $("notes").value = "";
  $("deleteCurrent").classList.add("hidden");
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = false);
}

function selectedSymptoms() {
  return [...document.querySelectorAll("#symptomChips input:checked")].map(i => i.value);
}

function formEntry() {
  const temp = $("temperature").value;
  const fluids = $("fluidsMl").value;
  const existingTime = $("time").value;

  return {
    date: state.selectedDate,
    time: state.editingExistingEntry && existingTime ? existingTime : nowTime(),
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

  state.editingExistingEntry = true;
  $("entryId").value = entry.id;
  $("time").value = entry.time || "";
  $("entryFormTitle").textContent = "Eintrag bearbeiten";
  $("autoTimeText").textContent = entry.time ? `Gespeichert um ${entry.time} Uhr` : "Gespeicherte Uhrzeit bleibt erhalten";
  $("temperature").value = entry.temperature ?? "";
  $("mood").value = entry.mood || "";
  $("fluidsMl").value = entry.fluids_ml ?? "";
  $("customSymptoms").value = entry.custom_symptoms || "";
  $("medication").value = entry.medication || "";
  $("food").value = entry.food || "";
  $("sleep").value = entry.sleep || "";
  $("diaperOrToilet").value = entry.diaper_or_toilet || "";
  $("notes").value = entry.notes || "";
  $("deleteCurrent").classList.remove("hidden");
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = (entry.symptoms || []).includes(i.value));
  openSheet();
}

async function deleteCurrentEntry() {
  const id = $("entryId").value;
  if (!id) return;
  if (!confirm("Diesen Eintrag löschen?")) return;
  await api(`./api/entries/${id}`, { method: "DELETE" });
  await loadState();
  closeSheet();
  showToast("Eintrag gelöscht");
}

function setDate(date) {
  state.selectedDate = date;
  renderDay();
}

function openView(id) {
  document.body.classList.add("modal-open");
  document.querySelectorAll(".modal-view").forEach(v => v.classList.add("hidden"));
  $(id).classList.remove("hidden");
}

function closeViews() {
  document.querySelectorAll(".modal-view").forEach(v => v.classList.add("hidden"));
  document.body.classList.remove("modal-open");
}

async function init() {
  $("selectedDate").value = state.selectedDate;

  $("todayButton").addEventListener("click", () => setDate(today()));
  $("prevDay").addEventListener("click", () => setDate(addDays(state.selectedDate, -1)));
  $("nextDay").addEventListener("click", () => setDate(addDays(state.selectedDate, 1)));
  $("selectedDate").addEventListener("change", e => setDate(e.target.value || today()));

  $("openEntry").addEventListener("click", () => {
    resetEntryForm();
    openSheet();
  });
  $("closeEntry").addEventListener("click", closeSheet);
  $("sheetBackdrop").addEventListener("click", closeSheet);
  $("deleteCurrent").addEventListener("click", deleteCurrentEntry);

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

  $("entryForm").addEventListener("submit", async event => {
    event.preventDefault();
    const id = $("entryId").value;
    const payload = formEntry();

    if (id) {
      await api(`./api/entries/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Aktualisiert");
    } else {
      await api("./api/entries", { method: "POST", body: JSON.stringify(payload) });
      showToast("Gespeichert");
    }

    await loadState();
    closeSheet();
  });

  $("saveProfileButton").addEventListener("click", async () => {
    const payload = {
      child_name: $("profileName").value.trim() || "Kind",
      birth_date: $("profileBirthDate").value,
      notes: $("profileNotes").value.trim()
    };
    await api("./api/profile", { method: "PUT", body: JSON.stringify(payload) });
    await loadState();
    showToast("Profil gespeichert");
    closeViews();
  });

  $("importFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Import überschreibt die aktuellen Daten. Fortfahren?")) return;
    const data = JSON.parse(await file.text());
    await api("./api/import", { method: "POST", body: JSON.stringify(data) });
    await loadState();
    showToast("Import abgeschlossen");
    event.target.value = "";
    closeViews();
  });

  $("profileButton").addEventListener("click", () => openView("profileView"));
  $("backupButton").addEventListener("click", () => openView("backupView"));

  document.querySelectorAll(".close-view").forEach(btn => btn.addEventListener("click", closeViews));

  try {
    await loadConfig();
    if (!state.config.pin_required || state.pin) await loadState();
  } catch (err) {
    if (String(err.message).includes("PIN")) showPin(err.message);
    else showToast(err.message);
  }
}

init();
