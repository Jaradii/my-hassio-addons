const state = {
  config: {},
  data: { profile: {}, entries: [] },
  pin: localStorage.getItem("kindgesund_pin") || "",
  selectedDate: today(),
  dayExpanded: false,
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

  container.innerHTML = renderDaySummaryCard(entries);
  const expandButton = container.querySelector("#toggleDetails");
  if (expandButton) {
    expandButton.addEventListener("click", () => {
      state.dayExpanded = !state.dayExpanded;
      renderDay();
    });
  }

  container.querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.dataset.id));
  });
}

function buildDaySummary(entries) {
  const fluidsTotal = entries.reduce((sum, e) => sum + (Number(e.fluids_ml) || 0), 0);
  const temperatures = entries
    .map(e => e.temperature)
    .filter(v => v !== null && v !== undefined && v !== "")
    .map(Number)
    .filter(v => !Number.isNaN(v));

  const latestTempEntry = entries.find(e => e.temperature !== null && e.temperature !== undefined && e.temperature !== "");
  const maxTemp = temperatures.length ? Math.max(...temperatures) : null;
  const minTemp = temperatures.length ? Math.min(...temperatures) : null;

  const symptomCounts = {};
  const addSymptom = (symptom) => {
    const s = String(symptom || "").trim();
    if (!s) return;
    symptomCounts[s] = (symptomCounts[s] || 0) + 1;
  };

  entries.forEach(entry => {
    (entry.symptoms || []).forEach(addSymptom);
    if (entry.custom_symptoms) {
      entry.custom_symptoms.split(",").forEach(addSymptom);
    }
  });

  const symptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const moods = entries.map(e => e.mood).filter(Boolean);
  const medications = entries.filter(e => e.medication);
  const foods = entries.filter(e => e.food);
  const sleeps = entries.filter(e => e.sleep);
  const diaper = entries.filter(e => e.diaper_or_toilet);
  const notes = entries.filter(e => e.notes);

  return {
    count: entries.length,
    fluidsTotal,
    temperatures,
    latestTempEntry,
    maxTemp,
    minTemp,
    symptoms,
    moods,
    medications,
    foods,
    sleeps,
    diaper,
    notes
  };
}

function renderDaySummaryCard(entries) {
  const summary = buildDaySummary(entries);
  const latestTempText = summary.latestTempEntry
    ? `${Number(summary.latestTempEntry.temperature).toFixed(1)}°`
    : "Keine";

  const tempMeta = summary.temperatures.length
    ? `Max ${summary.maxTemp.toFixed(1)}°${summary.minTemp !== summary.maxTemp ? ` · Min ${summary.minTemp.toFixed(1)}°` : ""}`
    : "Keine Messung";

  const symptomText = summary.symptoms.length
    ? summary.symptoms.slice(0, 4).map(([name, count]) => `${escapeHtml(name)}${count > 1 ? ` ×${count}` : ""}`).join(", ")
    : "Keine";

  const moodText = summary.moods.length
    ? escapeHtml(summary.moods[0])
    : "Keine";

  const expanded = state.dayExpanded;

  return `
    <article class="entry-card day-summary-card">
      <div class="entry-card-head">
        <div>
          <span class="entry-time">${summary.count} Eintrag${summary.count === 1 ? "" : "e"} zusammengefasst</span>
          <div class="entry-title">Tagesübersicht</div>
        </div>
        ${summary.latestTempEntry ? `<div class="temp-pill ${feverClass(summary.latestTempEntry.temperature)}">${latestTempText}</div>` : ""}
      </div>

      <div class="metric-grid day-summary-grid">
        <div class="metric"><span>Flüssigkeit gesamt</span><strong>${summary.fluidsTotal ? `${summary.fluidsTotal} ml` : "Keine"}</strong></div>
        <div class="metric"><span>Temperatur</span><strong>${escapeHtml(latestTempText)}</strong><small>${escapeHtml(tempMeta)}</small></div>
        <div class="metric"><span>Stimmung</span><strong>${moodText}</strong><small>${summary.moods.length > 1 ? `${summary.moods.length} Angaben` : "Letzte Angabe"}</small></div>
        <div class="metric"><span>Symptome</span><strong>${summary.symptoms.length || "Keine"}</strong><small>${symptomText}</small></div>
        <div class="metric"><span>Medikamente</span><strong>${summary.medications.length || "Keine"}</strong><small>${summary.medications.length ? "Einträge vorhanden" : "Nicht eingetragen"}</small></div>
        <div class="metric"><span>Essen / Schlaf</span><strong>${summary.foods.length + summary.sleeps.length || "Keine"}</strong><small>${summary.foods.length} Essen · ${summary.sleeps.length} Schlaf</small></div>
      </div>

      ${summary.symptoms.length ? `<div class="tags">${summary.symptoms.map(([s, count]) => `<span class="tag">${escapeHtml(s)}${count > 1 ? ` ×${count}` : ""}</span>`).join("")}</div>` : ""}

      ${renderSummaryTextBlocks(summary)}

      <div class="card-actions">
        <button id="toggleDetails" class="btn secondary">${expanded ? "Details ausblenden" : "Erweitern"}</button>
      </div>

      ${expanded ? renderExpandedEntries(entries) : ""}
    </article>
  `;
}

function renderSummaryTextBlocks(summary) {
  const blocks = [];

  if (summary.medications.length) {
    blocks.push(`<div class="note-block"><strong>Medikamente</strong>\n${summary.medications.map(e => `${escapeHtml(e.time || "--:--")} · ${escapeHtml(e.medication)}`).join("\n")}</div>`);
  }

  if (summary.foods.length) {
    blocks.push(`<div class="note-block"><strong>Essen</strong>\n${summary.foods.map(e => `${escapeHtml(e.time || "--:--")} · ${escapeHtml(e.food)}`).join("\n")}</div>`);
  }

  if (summary.sleeps.length) {
    blocks.push(`<div class="note-block"><strong>Schlaf</strong>\n${summary.sleeps.map(e => `${escapeHtml(e.time || "--:--")} · ${escapeHtml(e.sleep)}`).join("\n")}</div>`);
  }

  if (summary.diaper.length) {
    blocks.push(`<div class="note-block"><strong>Windel / Toilette</strong>\n${summary.diaper.map(e => `${escapeHtml(e.time || "--:--")} · ${escapeHtml(e.diaper_or_toilet)}`).join("\n")}</div>`);
  }

  if (summary.notes.length) {
    blocks.push(`<div class="note-block"><strong>Notizen</strong>\n${summary.notes.map(e => `${escapeHtml(e.time || "--:--")} · ${escapeHtml(e.notes)}`).join("\n")}</div>`);
  }

  return blocks.join("");
}

function renderExpandedEntries(entries) {
  return `
    <div class="expanded-details">
      <h3>Einzelne Einträge</h3>
      ${entries.map(renderEntryDetail).join("")}
    </div>
  `;
}

function renderEntryDetail(entry) {
  const symptoms = [...(entry.symptoms || [])];
  if (entry.custom_symptoms) symptoms.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));

  const rows = [
    entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "" ? ["Temperatur", `${Number(entry.temperature).toFixed(1)} °C`] : null,
    entry.fluids_ml ? ["Flüssigkeit", `${entry.fluids_ml} ml`] : null,
    entry.mood ? ["Stimmung", entry.mood] : null,
    symptoms.length ? ["Symptome", symptoms.join(", ")] : null,
    entry.medication ? ["Medikamente", entry.medication] : null,
    entry.food ? ["Essen", entry.food] : null,
    entry.sleep ? ["Schlaf", entry.sleep] : null,
    entry.diaper_or_toilet ? ["Windel / Toilette", entry.diaper_or_toilet] : null,
    entry.notes ? ["Notizen", entry.notes] : null
  ].filter(Boolean);

  return `
    <div class="entry-detail">
      <div class="entry-detail-head">
        <strong>${escapeHtml(entry.time || "--:--")} Uhr</strong>
        <button class="btn secondary edit-entry" data-id="${entry.id}">Bearbeiten</button>
      </div>
      ${rows.length ? rows.map(([label, value]) => `
        <div class="detail-row">
          <span>${escapeHtml(label)}</span>
          <p>${escapeHtml(value)}</p>
        </div>
      `).join("") : `<p class="muted-detail">Keine Details eingetragen.</p>`}
    </div>
  `;
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
  state.dayExpanded = false;
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
