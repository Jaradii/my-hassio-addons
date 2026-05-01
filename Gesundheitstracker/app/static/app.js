const state = {
  config: {},
  data: { profile: {}, entries: [] },
  theme: localStorage.getItem("kindgesund_theme") || "babyblue",
  pin: localStorage.getItem("kindgesund_pin") || "",
  selectedDate: today(),
  calendarMonth: today().slice(0, 7),
  dayExpanded: false,
  editingExistingEntry: false
};

const $ = (id) => document.getElementById(id);

function openSelectedDatePicker() {
  state.calendarMonth = state.selectedDate.slice(0, 7);
  openCalendarSheet();
}

function onIfExists(id, eventName, handler) {
  const el = $(id);
  if (el) el.addEventListener(eventName, handler);
}

function animateHide(element, closingClass, afterClose) {
  if (!element || element.classList.contains("hidden")) {
    if (afterClose) afterClose();
    return;
  }

  element.classList.add(closingClass);
  const finish = () => {
    element.classList.add("hidden");
    element.classList.remove(closingClass);
    if (afterClose) afterClose();
  };

  window.setTimeout(finish, 280);
}

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


function symptomIcon(symptom) {
  const s = String(symptom || "").trim().toLowerCase();
  if (!s) return "🩺";
  if (s.includes("fieber") || s.includes("temperatur")) return "🌡️";
  if (s.includes("husten")) return "🤧";
  if (s.includes("schnupfen") || s.includes("nase")) return "👃";
  if (s.includes("halsschmerz") || s.includes("hals")) return "🗣️";
  if (s.includes("ohr")) return "👂";
  if (s.includes("kopf")) return "🤕";
  if (s.includes("bauch") || s.includes("magen")) return "🤢";
  if (s.includes("übel") || s.includes("uebel")) return "🤢";
  if (s.includes("erbrechen")) return "🤮";
  if (s.includes("durchfall")) return "🚽";
  if (s.includes("verstopfung")) return "🚽";
  if (s.includes("ausschlag") || s.includes("haut")) return "🩹";
  if (s.includes("schlaf")) return "😴";
  if (s.includes("müde") || s.includes("muede")) return "😴";
  if (s.includes("appetit")) return "🍽️";
  if (s.includes("trinken") || s.includes("durst")) return "💧";
  if (s.includes("schmerz")) return "⚠️";
  if (s.includes("unruh")) return "😣";
  if (s.includes("weinen")) return "😢";
  return "🩺";
}

function renderSymptomTag(symptom, count = 1, intensities = []) {
  const icon = symptomIcon(symptom);
  const uniqueIntensities = [...new Set((intensities || []).filter(Boolean))];
  const intensityText = uniqueIntensities.length ? ` (${uniqueIntensities.join("/")})` : "";
  return `<span class="tag symptom-tag"><span class="symptom-icon">${icon}</span><span>${escapeHtml(symptom)}${count > 1 ? ` ×${count}` : ""}${escapeHtml(intensityText)}</span></span>`;
}

function renderSymptomList(symptoms) {
  if (!symptoms || !symptoms.length) return "";
  return `<div class="symptom-list">${symptoms.map(symptom => {
    const name = String(symptom || "").trim();
    if (!name) return "";
    return `<span class="symptom-chip"><span class="symptom-icon">${symptomIcon(name)}</span><span>${escapeHtml(name)}</span></span>`;
  }).join("")}</div>`;
}

function applyTheme(theme) {
  const allowed = ["babyblue", "mint", "lavender", "peach", "rose", "slate", "darkslate", "ocean", "forest", "sand", "berry", "mono"];
  const next = allowed.includes(theme) ? theme : "babyblue";
  state.theme = next;
  document.body.dataset.theme = next;
  localStorage.setItem("kindgesund_theme", next);
  const selector = $("themeSelect");
  if (selector) selector.value = next;
}

async function loadConfig() {
  state.config = await api("./api/config", { headers: {} });
  document.title = state.config.app_title || "KindGesund";
  document.body.classList.toggle("dark", Boolean(state.config.dark_mode));
  applyTheme(state.theme);
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
  $("activeProfileTitle").textContent = name;
  $("profileName").value = name;
  $("profileBirthDate").value = profile.birth_date || "";
  $("profileNotes").value = profile.notes || "";
  const themeSelector = $("themeSelect");
  if (themeSelector) themeSelector.value = state.theme;
}

function selectedEntries() {
  return (state.data.entries || [])
    .filter(e => e.date === state.selectedDate)
    .sort((a, b) => (b.time || "").localeCompare(a.time || ""));
}

function monthLabel(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric"
  });
}

function addMonths(month, amount) {
  const [year, monthIndex] = month.split("-").map(Number);
  const d = new Date(year, monthIndex - 1 + amount, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function entryDatesSet() {
  return new Set((state.data.entries || []).map(entry => entry.date).filter(Boolean));
}

function openCalendarSheet() {
  const sheet = $("calendarSheet");
  if (!sheet) return;
  document.body.classList.add("calendar-open");
  renderCalendar();
  sheet.classList.remove("closing", "hidden");
  sheet.setAttribute("aria-hidden", "false");
}

function closeCalendarSheet() {
  const sheet = $("calendarSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("calendar-open");
  animateHide(sheet, "closing");
}

function renderCalendar() {
  const grid = $("calendarGrid");
  if (!grid) return;

  const month = state.calendarMonth || state.selectedDate.slice(0, 7);
  $("calendarMonthLabel").textContent = monthLabel(month);

  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const mondayStartOffset = (first.getDay() + 6) % 7;
  const markedDates = entryDatesSet();
  const todayValue = today();

  const cells = [];

  for (let i = 0; i < mondayStartOffset; i += 1) {
    cells.push(`<div class="calendar-day empty" aria-hidden="true"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = `${month}-${String(day).padStart(2, "0")}`;
    const hasEntry = markedDates.has(value);
    const selected = value === state.selectedDate;
    const isToday = value === todayValue;

    cells.push(`
      <button
        type="button"
        class="calendar-day ${hasEntry ? "has-entry" : ""} ${selected ? "selected" : ""} ${isToday ? "today" : ""}"
        data-date="${value}"
        aria-label="${day}. ${monthLabel(month)}${hasEntry ? ", mit Eintrag" : ""}"
      >
        <span>${day}</span>
      </button>
    `);
  }

  while (cells.length < 42) {
    cells.push(`<div class="calendar-day empty" aria-hidden="true"></div>`);
  }

  grid.innerHTML = cells.join("");

  grid.querySelectorAll(".calendar-day[data-date]").forEach(button => {
    button.addEventListener("click", () => {
      setDate(button.dataset.date);
      closeCalendarSheet();
    });
  });
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
  container.querySelectorAll(".journal-history-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const wrap = document.getElementById(`journalHistory-${btn.dataset.id}`);
      const details = wrap ? wrap.querySelector(".history-box") : null;
      if (!details) return;
      details.open = !details.open;
      if (details.open) {
        wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  container.querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.dataset.id));
  });
  container.querySelectorAll(".summary-history-button").forEach(btn => {
    btn.addEventListener("click", () => openEntryHistoryPopup(btn.dataset.id));
  });

  container.querySelectorAll(".edit-summary-field").forEach(btn => {
    btn.addEventListener("click", () => openFieldEdit(btn.dataset.id, btn.dataset.field));
  });
  container.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
  });
  container.querySelectorAll(".quick-tile").forEach(tile => {
    tile.addEventListener("click", () => openQuickEntry(tile.dataset.quick));
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
  const symptomIntensities = {};
  const addSymptom = (symptom, intensity = "") => {
    const s = String(symptom || "").trim();
    if (!s) return;
    symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    if (intensity) {
      if (!symptomIntensities[s]) symptomIntensities[s] = [];
      symptomIntensities[s].push(intensity);
    }
  };

  entries.forEach(entry => {
    const intensityMap = entry.symptom_intensity || {};
    (entry.symptoms || []).forEach(symptom => addSymptom(symptom, intensityMap[symptom] || ""));
    if (entry.custom_symptoms) {
      entry.custom_symptoms.split(",").forEach(symptom => addSymptom(symptom));
    }
  });

  const symptoms = Object.entries(symptomCounts)
    .map(([name, count]) => [name, count, symptomIntensities[name] || []])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

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
        ${""}
      </div>

      <div class="day-tile-grid">
        <button type="button" class="day-tile quick-tile" data-quick="fluids" aria-label="Flüssigkeit eintragen">
          <span class="tile-icon">💧</span>
          <span class="tile-label">Flüssigkeit</span>
          <strong>${summary.fluidsTotal ? `${summary.fluidsTotal} ml` : "Keine"}</strong>
        </button>
        <button type="button" class="day-tile quick-tile temperature-tile ${summary.latestTempEntry ? feverClass(summary.latestTempEntry.temperature) : ""}" data-quick="temperature" aria-label="Temperatur eintragen">
          <span class="tile-icon">🌡️</span>
          <span class="tile-label">Temperatur</span>
          <strong>${escapeHtml(latestTempText)}</strong>
          <small>${escapeHtml(tempMeta)}</small>
        </button>
        <button type="button" class="day-tile quick-tile" data-quick="mood" aria-label="Stimmung eintragen">
          <span class="tile-icon">🙂</span>
          <span class="tile-label">Stimmung</span>
          <strong>${moodText}</strong>
          <small>${summary.moods.length > 1 ? `${summary.moods.length} Angaben` : "Letzte Angabe"}</small>
        </button>
        <button type="button" class="day-tile quick-tile" data-quick="symptoms" aria-label="Symptome eintragen">
          <span class="tile-icon">🤧</span>
          <span class="tile-label">Symptome</span>
          <strong>${summary.symptoms.length || "Keine"}</strong>
          <small>${symptomText}</small>
        </button>
        <button type="button" class="day-tile quick-tile" data-quick="medication" aria-label="Medikament eintragen">
          <span class="tile-icon">💊</span>
          <span class="tile-label">Medikamente</span>
          <strong>${summary.medications.length || "Keine"}</strong>
          <small>${summary.medications.length ? "Einträge" : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile" data-quick="food" aria-label="Essen oder Schlaf eintragen">
          <span class="tile-icon tile-duo"><span>🍽️</span><span>😴</span></span>
          <span class="tile-label">Essen / Schlaf</span>
          <strong>${summary.foods.length + summary.sleeps.length || "Keine"}</strong>
          <small>${summary.foods.length} Essen · ${summary.sleeps.length} Schlaf</small>
        </button>
      </div>

      ${summary.symptoms.length ? `<div class="tags symptom-tags">${summary.symptoms.map(([s, count, intensities]) => renderSymptomTag(s, count, intensities)).join("")}</div>` : ""}

      ${renderSummaryTextBlocks(summary)}


    </article>
  `;
}

function renderSummaryTextBlocks(summary) {
  const blocks = [];

  const renderItems = (items, key, icon, title) => {
    if (!items.length) return "";
    return `
      <section class="summary-info-card">
        <div class="summary-info-head">
          <span class="summary-info-icon">${icon}</span>
          <strong>${title}</strong>
        </div>
        <div class="summary-info-list">
          ${items.map(e => `
            <div class="summary-info-item">
              <span class="summary-info-time">${escapeHtml(e.time || "--:--")}</span>
              <p>${escapeHtml(e[key] || "")}</p>
              <div class="summary-row-actions">
                <button type="button" class="summary-edit-button summary-history-button" data-id="${e.id}" aria-label="Historie anzeigen">↻</button>
                <button type="button" class="summary-edit-button edit-summary-field" data-id="${e.id}" data-field="${key}" aria-label="${title} bearbeiten">✎</button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  };

  blocks.push(renderItems(summary.medications, "medication", "💊", "Medikamente"));
  blocks.push(renderItems(summary.foods, "food", "🍽️", "Essen"));
  blocks.push(renderItems(summary.sleeps, "sleep", "😴", "Schlaf"));
  blocks.push(renderItems(summary.diaper, "diaper_or_toilet", "🚽", "Windel / Toilette"));
  blocks.push(renderItems(summary.notes, "notes", "📝", "Notizen"));

  return blocks.filter(Boolean).join("");
}

function entryPreviewText(entry) {
  const parts = [];

  if (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "") {
    parts.push(`${Number(entry.temperature).toFixed(1)} °C`);
  }
  if (entry.fluids_ml) parts.push(`${entry.fluids_ml} ml`);
  if (entry.mood) parts.push(entry.mood);
  if ((entry.symptoms || []).length) parts.push((entry.symptoms || []).join(", "));
  if (entry.medication) parts.push("Medikamente");
  if (entry.food) parts.push("Essen");
  if (entry.sleep) parts.push("Schlaf");
  if (entry.diaper_or_toilet) parts.push("Windel/Toilette");
  if (entry.notes) parts.push("Notiz");

  return parts.length ? parts.join(" · ") : "Keine Detailwerte";
}

function openDayDetailSheet(entries) {
  const sheet = $("dayDetailSheet");
  const list = $("dayDetailList");
  if (!sheet || !list) return;

  const sorted = [...entries].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  $("dayDetailSubtitle").textContent = `${sorted.length} Eintrag${sorted.length === 1 ? "" : "e"} am ${formatDateShortGerman(state.selectedDate)}`;

  list.innerHTML = sorted.length ? sorted.map(entry => `
    <button type="button" class="day-detail-entry" data-id="${entry.id}">
      <span class="day-detail-entry-time">${escapeHtml(entry.time || "--:--")}</span>
      <span class="day-detail-entry-body">
        <strong>${escapeHtml(entryPreviewText(entry))}</strong>
        <small>Details anzeigen</small>
      </span>
      <span class="day-detail-entry-arrow">›</span>
    </button>
  `).join("") : `<p class="muted-detail">Keine Einträge vorhanden.</p>`;

  list.querySelectorAll(".day-detail-entry").forEach(button => {
    button.addEventListener("click", () => openEntryDetailPopup(button.dataset.id));
  });

  sheet.classList.remove("closing", "hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("day-detail-open");
}

function closeDayDetailSheet() {
  const sheet = $("dayDetailSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("day-detail-open");
  animateHide(sheet, "closing");
}

function openEntryDetailPopup(entryId) {
  const entry = (state.data.entries || []).find(e => e.id === entryId);
  if (!entry) return;

  $("entryDetailPopupTitle").textContent = `${entry.time || "--:--"} Uhr`;
  $("entryDetailPopupSubtitle").textContent = formatDateShortGerman(entry.date || state.selectedDate);
  $("entryDetailPopupContent").innerHTML = renderEntryDetail(entry);

  const popup = $("entryDetailPopup");
  popup.classList.remove("closing", "hidden");
  popup.setAttribute("aria-hidden", "false");
  document.body.classList.add("entry-detail-popup-open");

  // Bind buttons inside the freshly rendered detail popup.
  $("entryDetailPopupContent").querySelectorAll(".journal-history-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const wrap = document.getElementById(`journalHistory-${btn.dataset.id}`);
      const details = wrap ? wrap.querySelector(".history-box") : null;
      if (!details) return;
      details.open = !details.open;
    });
  });

  $("entryDetailPopupContent").querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      closeEntryDetailPopup();
      closeDayDetailSheet();
      editEntry(btn.dataset.id);
    });
  });

  $("entryDetailPopupContent").querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteEntry(btn.dataset.id);
      closeEntryDetailPopup();
      closeDayDetailSheet();
    });
  });
}

function closeEntryDetailPopup() {
  const popup = $("entryDetailPopup");
  if (!popup || popup.classList.contains("hidden")) return;
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("entry-detail-popup-open");
  animateHide(popup, "closing", () => {
    $("entryDetailPopupContent").innerHTML = "";
  });
}

function renderExpandedEntries(entries) {
  return `
    <div class="expanded-details">
      <h3>Einzelne Einträge</h3>
      ${entries.map(renderEntryDetail).join("")}
    </div>
  `;
}

function userLabel(user) {
  if (!user || typeof user !== "object") return "Unbekannt";
  return user.display_name || user.name || user.label || "Unbekannt";
}

function formatTimestamp(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function entryWasEdited(entry) {
  if (!entry || !entry.updated_at || !entry.created_at) return false;

  const created = new Date(entry.created_at).getTime();
  const updated = new Date(entry.updated_at).getTime();

  if (Number.isNaN(created) || Number.isNaN(updated)) return false;

  const timeChanged = Math.abs(updated - created) > 1000;
  const createdUser = userLabel(entry.created_by);
  const updatedUser = userLabel(entry.updated_by);
  const userChanged = updatedUser !== "Unbekannt" && updatedUser !== createdUser;

  return timeChanged || userChanged;
}

function historyActionLabel(action) {
  if (action === "created") return "Erstellt";
  if (action === "updated") return "Bearbeitet";
  if (action === "deleted") return "Gelöscht";
  return action || "Ereignis";
}

function fieldLabel(field) {
  const labels = {
    date: "Datum",
    time: "Uhrzeit",
    temperature: "Temperatur",
    mood: "Stimmung",
    symptoms: "Symptome",
    symptom_intensity: "Symptom-Intensität",
    custom_symptoms: "Weitere Symptome",
    medication: "Medikamente",
    fluids_ml: "Flüssigkeit",
    food: "Essen",
    sleep: "Schlaf",
    diaper_or_toilet: "Windel / Toilette",
    notes: "Notizen"
  };
  return labels[field] || field;
}

function formatSymptomIntensity(map) {
  if (!map || typeof map !== "object") return "";
  return Object.entries(map)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");
}

function formatHistoryValue(field, value) {
  if (value === null || value === undefined || value === "") return "leer";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "leer";
  if (field === "symptom_intensity") {
    const text = formatSymptomIntensity(value);
    return text || "leer";
  }

  if (field === "temperature") {
    const n = Number(value);
    return Number.isNaN(n) ? String(value) : `${n.toFixed(1)} °C`;
  }

  if (field === "fluids_ml") {
    const n = Number(value);
    return Number.isNaN(n) ? String(value) : `${n} ml`;
  }

  return String(value);
}

function renderChangeDetails(event) {
  const changes = Array.isArray(event.changes) ? event.changes : [];

  if (changes.length) {
    return `
      <div class="history-change-list">
        ${changes.map(change => `
          <div class="history-change-row">
            <span class="history-change-field">${escapeHtml(fieldLabel(change.field))}</span>
            <div class="history-change-values">
              <span class="history-old">${escapeHtml(formatHistoryValue(change.field, change.before))}</span>
              <span class="history-arrow">→</span>
              <span class="history-new">${escapeHtml(formatHistoryValue(change.field, change.after))}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  const fields = Array.isArray(event.fields) ? event.fields : [];
  if (!fields.length) return "";

  return `
    <div class="history-fields-inline">
      ${fields.map(field => `<span>${escapeHtml(fieldLabel(field))}</span>`).join("")}
    </div>
  `;
}

function renderEntryHistory(entry) {
  let history = Array.isArray(entry.history) ? entry.history.filter(Boolean) : [];

  if (!history.length) {
    history = [{
      action: "created",
      at: entry.created_at,
      by: entry.created_by || {},
      fields: []
    }];

    if (entryWasEdited(entry)) {
      history.push({
        action: "updated",
        at: entry.updated_at,
        by: entry.updated_by || {},
        fields: []
      });
    }
  }

  const sorted = history.slice().sort((a, b) => {
    const atA = new Date(a.at || 0).getTime();
    const atB = new Date(b.at || 0).getTime();
    return atB - atA;
  });

  return `
    <details class="history-box compact-history">
      <summary aria-label="Historie anzeigen">
        <span class="history-summary-icon">↻</span>
        <span class="history-summary-text">Historie</span>
        <span class="history-summary-count">${sorted.length}</span>
      </summary>
      <div class="history-list compact-history-list">
        ${sorted.map(event => {
          return `
            <div class="history-row">
              <div class="history-row-main">
                <span class="history-action">${escapeHtml(historyActionLabel(event.action))}</span>
                <span class="history-user-inline">${escapeHtml(userLabel(event.by))}</span>
                <span class="history-date">${escapeHtml(formatTimestamp(event.at) || "")}</span>
              </div>
              ${renderChangeDetails(event)}
            </div>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function formatDateShortGerman(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${String(year).slice(-2)}`;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });
}

function detailIcon(label) {
  const icons = {
    "Temperatur": "🌡️",
    "Flüssigkeit": "💧",
    "Stimmung": "🙂",
    "Medikamente": "💊",
    "Essen": "🍽️",
    "Schlaf": "😴",
    "Windel / Toilette": "🚽",
    "Notizen": "📝"
  };
  return icons[label] || "•";
}

function renderEntryDetail(entry) {
  const intensityMap = entry.symptom_intensity || {};
  const symptoms = [...(entry.symptoms || [])].map(s => {
    const level = intensityMap[s];
    return level ? `${s} (${level})` : s;
  });
  if (entry.custom_symptoms) symptoms.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));

  const rows = [
    entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "" ? ["Temperatur", `${Number(entry.temperature).toFixed(1)} °C`, feverClass(entry.temperature)] : null,
    entry.fluids_ml ? ["Flüssigkeit", `${entry.fluids_ml} ml`, ""] : null,
    entry.mood ? ["Stimmung", entry.mood, ""] : null,
    entry.medication ? ["Medikamente", entry.medication, ""] : null,
    entry.food ? ["Essen", entry.food, ""] : null,
    entry.sleep ? ["Schlaf", entry.sleep, ""] : null,
    entry.diaper_or_toilet ? ["Windel / Toilette", entry.diaper_or_toilet, ""] : null,
    entry.notes ? ["Notizen", entry.notes, ""] : null
  ].filter(Boolean);

  const importantRows = rows.filter(([label]) => ["Temperatur", "Flüssigkeit", "Stimmung"].includes(label));
  const noteRows = rows.filter(([label]) => !["Temperatur", "Flüssigkeit", "Stimmung"].includes(label));

  return `
    <article class="entry-detail journal-detail">
      <div class="journal-rail" aria-hidden="true">
        <span></span>
      </div>

      <div class="journal-card">
        <header class="journal-head">
          <div class="journal-head-main">
            <span class="journal-kicker">Eintrag</span>
            <strong>${escapeHtml(entry.time || "--:--")} Uhr</strong>
            <small>${escapeHtml(formatDateShortGerman(entry.date))}</small>
          </div>
          <div class="journal-actions">
            <button type="button" class="journal-action-button journal-history-toggle" data-id="${entry.id}" aria-label="Historie anzeigen">↻</button>
            <button type="button" class="journal-action-button edit-entry" data-id="${entry.id}" aria-label="Eintrag bearbeiten">✎</button>
            <button type="button" class="journal-action-button danger delete-entry" data-id="${entry.id}" aria-label="Eintrag löschen">×</button>
          </div>
        </header>

        ${importantRows.length ? `
          <div class="journal-metrics">
            ${importantRows.map(([label, value, extraClass]) => `
              <div class="journal-metric ${extraClass || ""}">
                <span>${detailIcon(label)}</span>
                <div>
                  <small>${escapeHtml(label)}</small>
                  <strong>${escapeHtml(value)}</strong>
                </div>
              </div>
            `).join("")}
          </div>
        ` : ""}

        ${symptoms.length ? `
          <section class="journal-section">
            <div class="journal-section-title">
              <span>🤧</span>
              <strong>Symptome</strong>
            </div>
            ${renderSymptomList(symptoms)}
          </section>
        ` : ""}

        ${noteRows.length ? `
          <section class="journal-section">
            <div class="journal-section-title">
              <span>📝</span>
              <strong>Weitere Angaben</strong>
            </div>
            <div class="journal-field-list">
              ${noteRows.map(([label, value]) => `
                <div class="journal-field">
                  <div class="journal-field-label">
                    <span>${detailIcon(label)}</span>
                    <strong>${escapeHtml(label)}</strong>
                  </div>
                  <p>${escapeHtml(value)}</p>
                </div>
              `).join("")}
            </div>
          </section>
        ` : ""}

        ${!rows.length && !symptoms.length ? `
          <section class="journal-empty">
            <span>📝</span>
            <strong>Keine Details eingetragen</strong>
          </section>
        ` : ""}

        <footer class="journal-history" id="journalHistory-${entry.id}">
          ${renderEntryHistory(entry)}
        </footer>
      </div>
    </article>
  `;
}

function feverClass(temp) {
  if (temp === null || temp === undefined || temp === "") return "";
  const value = Number(temp);
  if (Number.isNaN(value)) return "";
  if (value >= 39.0) return "temp-red";
  if (value >= 38.5) return "temp-orange";
  if (value >= 37.6) return "temp-yellow";
  return "temp-green";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function focusEntryField(kind) {
  const targetMap = {
    temperature: "temperature",
    fluids: "fluidsMl",
    mood: "moodOptions",
    symptoms: "symptomChips",
    medication: "medication",
    food: "food",
    sleep: "sleep",
    notes: "notes"
  };

  const id = targetMap[kind];
  if (!id) return;

  window.setTimeout(() => {
    const el = $(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    if (["temperature", "fluidsMl", "medication", "food", "sleep", "notes"].includes(id)) {
      window.setTimeout(() => el.focus({ preventScroll: true }), 280);
    }
  }, 260);
}

function quickDefinition(kind) {
  const symptomsHtml = `
    <div id="quickSymptomChips" class="quick-symptom-grid">
      <label><input type="checkbox" value="Fieber"><span class="symptom-icon">🌡️</span><span>Fieber</span><select class="quick-symptom-intensity" data-symptom="Fieber" aria-label="Intensität Fieber"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Husten"><span class="symptom-icon">🤧</span><span>Husten</span><select class="quick-symptom-intensity" data-symptom="Husten" aria-label="Intensität Husten"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Schnupfen"><span class="symptom-icon">👃</span><span>Schnupfen</span><select class="quick-symptom-intensity" data-symptom="Schnupfen" aria-label="Intensität Schnupfen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Halsschmerzen"><span class="symptom-icon">🗣️</span><span>Hals</span><select class="quick-symptom-intensity" data-symptom="Halsschmerzen" aria-label="Intensität Halsschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Ohrenschmerzen"><span class="symptom-icon">👂</span><span>Ohren</span><select class="quick-symptom-intensity" data-symptom="Ohrenschmerzen" aria-label="Intensität Ohrenschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Bauchschmerzen"><span class="symptom-icon">🤢</span><span>Bauch</span><select class="quick-symptom-intensity" data-symptom="Bauchschmerzen" aria-label="Intensität Bauchschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Durchfall"><span class="symptom-icon">🚽</span><span>Durchfall</span><select class="quick-symptom-intensity" data-symptom="Durchfall" aria-label="Intensität Durchfall"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Erbrechen"><span class="symptom-icon">🤮</span><span>Erbrechen</span><select class="quick-symptom-intensity" data-symptom="Erbrechen" aria-label="Intensität Erbrechen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Ausschlag"><span class="symptom-icon">🩹</span><span>Ausschlag</span><select class="quick-symptom-intensity" data-symptom="Ausschlag" aria-label="Intensität Ausschlag"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Appetitlosigkeit"><span class="symptom-icon">🍽️</span><span>Appetit</span><select class="quick-symptom-intensity" data-symptom="Appetitlosigkeit" aria-label="Intensität Appetitlosigkeit"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
    </div>
    <label class="field quick-field"><span>Weitere Symptome</span><input id="quickCustomSymptoms" type="text" placeholder="optional"></label>
  `;
  const defs = {
    fluids: { title: "Flüssigkeit", subtitle: "Getrunkene Menge in ml eintragen.", content: `<label class="field quick-field"><span>Flüssigkeit in ml</span><input id="quickFluidsMl" type="number" min="0" step="10" inputmode="numeric" placeholder="z. B. 250"></label>` },
    temperature: { title: "Temperatur", subtitle: "Temperatur für diesen Tag speichern.", content: `<label class="field quick-field"><span>Temperatur in °C</span><input id="quickTemperature" type="number" step="0.1" min="30" max="45" placeholder="z. B. 38,5"><input id="quickTemperatureSlider" class="temperature-slider" type="range" min="34" max="42" step="0.1" value="37.0"><div class="slider-scale"><span>34°</span><span>37°</span><span>39°</span><span>42°</span></div></label>` },
    mood: { title: "Stimmung", subtitle: "Aktuelle Stimmung auswählen.", content: `<input id="quickMood" type="hidden"><div id="quickMoodOptions" class="mood-options quick-mood-options"><button type="button" class="mood-option" data-mood="Gut drauf"><span>😊</span><small>Gut</small></button><button type="button" class="mood-option" data-mood="Müde"><span>😴</span><small>Müde</small></button><button type="button" class="mood-option" data-mood="Quengelig"><span>😣</span><small>Quengelig</small></button><button type="button" class="mood-option" data-mood="Schlapp"><span>🥱</span><small>Schlapp</small></button><button type="button" class="mood-option" data-mood="Schmerzen"><span>🤕</span><small>Schmerz</small></button><button type="button" class="mood-option" data-mood="Unruhig"><span>😟</span><small>Unruhig</small></button></div>` },
    symptoms: { title: "Symptome", subtitle: "Ein oder mehrere Symptome auswählen.", content: symptomsHtml },
    medication: { title: "Medikamente", subtitle: "Medikament, Dosis oder Uhrzeit notieren.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">💊</span>Medikamente</span><textarea id="quickMedication" rows="3" placeholder="Name, Dosis, Uhrzeit"></textarea></label>` },
    food: { title: "Essen / Schlaf", subtitle: "Essen oder Schlaf kurz eintragen.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">🍽️</span>Essen</span><textarea id="quickFood" rows="2" placeholder="Was wurde gegessen?"></textarea></label><label class="field quick-field icon-textarea-field"><span><span class="field-icon">😴</span>Schlaf</span><textarea id="quickSleep" rows="2" placeholder="Dauer, Qualität, Auffälligkeiten"></textarea></label>` }
  };
  return defs[kind] || null;
}

function openQuickEntry(kind) {
  const def = quickDefinition(kind);
  if (!def) return;
  document.body.classList.add("quick-open");
  $("quickKind").value = kind;
  $("quickTitle").textContent = def.title;
  $("quickSubtitle").textContent = def.subtitle;
  $("quickContent").innerHTML = def.content;
  const sheet = $("quickSheet");
  sheet.classList.remove("closing", "hidden");
  sheet.setAttribute("aria-hidden", "false");
  bindQuickControls(kind);
  window.setTimeout(() => {
    const first = $("quickContent").querySelector("input:not([type='hidden']), textarea, button");
    if (first) first.focus({ preventScroll: true });
  }, 220);
}

function closeQuickSheet() {
  const sheet = $("quickSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("quick-open");
  animateHide(sheet, "closing", () => {
    $("quickContent").innerHTML = "";
    $("quickKind").value = "";
  });
}

function bindQuickControls(kind) {
  if (kind === "temperature") {
    const input = $("quickTemperature"), slider = $("quickTemperatureSlider");
    const sync = (value, source) => {
      if (value === "") return;
      const num = Number(String(value).replace(",", "."));
      if (Number.isNaN(num)) return;
      const clamped = Math.min(42, Math.max(34, num));
      slider.value = clamped.toFixed(1);
      if (source === "slider") input.value = clamped.toFixed(1);
    };
    input.addEventListener("input", e => sync(e.target.value, "input"));
    input.addEventListener("blur", e => {
      const num = Number(String(e.target.value).replace(",", "."));
      if (!Number.isNaN(num)) e.target.value = num.toFixed(1);
    });
    slider.addEventListener("input", e => sync(e.target.value, "slider"));
  }
  if (kind === "mood") {
    $("quickContent").querySelectorAll(".mood-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = $("quickMood").value === btn.dataset.mood ? "" : btn.dataset.mood;
        $("quickMood").value = next;
        $("quickContent").querySelectorAll(".mood-option").forEach(item => item.classList.toggle("active", item.dataset.mood === next));
      });
    });
  }

  if (kind === "symptoms") {
    $("quickContent").querySelectorAll("#quickSymptomChips input[type='checkbox']").forEach(input => {
      input.addEventListener("change", updateQuickSymptomIntensityControls);
    });
    updateQuickSymptomIntensityControls();
  }
}

function updateQuickSymptomIntensityControls() {
  document.querySelectorAll("#quickSymptomChips label").forEach(label => {
    const input = label.querySelector("input[type='checkbox']");
    const select = label.querySelector(".quick-symptom-intensity");
    if (!input || !select) return;
    select.disabled = false;
    label.classList.toggle("with-intensity", true);
  });
}

function selectedQuickSymptomIntensity() {
  const map = {};
  document.querySelectorAll("#quickSymptomChips input:checked").forEach(input => {
    const select = document.querySelector(`.quick-symptom-intensity[data-symptom="${CSS.escape(input.value)}"]`);
    if (select && select.value) map[input.value] = select.value;
  });
  return map;
}

function quickPayload(kind) {
  const payload = { date: state.selectedDate, time: nowTime(), temperature: null, mood: "", symptoms: [], custom_symptoms: "", symptom_intensity: {}, medication: "", fluids_ml: null, food: "", sleep: "", diaper_or_toilet: "", notes: "" };
  if (kind === "temperature") {
    const v = $("quickTemperature").value;
    payload.temperature = v === "" ? null : Number(String(v).replace(",", "."));
  } else if (kind === "fluids") {
    const v = $("quickFluidsMl").value;
    payload.fluids_ml = v === "" ? null : Number(v);
  } else if (kind === "mood") {
    payload.mood = $("quickMood").value;
  } else if (kind === "symptoms") {
    payload.symptoms = [...document.querySelectorAll("#quickSymptomChips input:checked")].map(i => i.value);
    payload.symptom_intensity = selectedQuickSymptomIntensity();
    payload.custom_symptoms = $("quickCustomSymptoms").value.trim();
  } else if (kind === "medication") {
    payload.medication = $("quickMedication").value.trim();
  } else if (kind === "food") {
    payload.food = $("quickFood").value.trim();
    payload.sleep = $("quickSleep").value.trim();
  }
  return payload;
}

function quickPayloadHasValue(payload) {
  return [payload.temperature !== null && !Number.isNaN(payload.temperature), payload.fluids_ml !== null && !Number.isNaN(payload.fluids_ml), payload.mood, payload.symptoms.length, payload.custom_symptoms, payload.medication, payload.food, payload.sleep].some(Boolean);
}

function openSheet() {
  document.body.classList.add("sheet-open");
  const sheet = $("entrySheet");
  sheet.classList.remove("closing");
  sheet.classList.remove("hidden");
  sheet.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  const sheet = $("entrySheet");
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");
  animateHide(sheet, "closing", resetEntryForm);
}

function resetEntryForm() {
  state.editingExistingEntry = false;
  $("entryId").value = "";
  $("entryDate").value = state.selectedDate;
  $("entryTime").value = nowTime();
  $("entryFormTitle").textContent = "Neuer Eintrag";
  $("autoTimeText").textContent = "Nachträgliche Einträge sind über Datum und Uhrzeit möglich";
  $("temperature").value = "";
  $("temperatureSlider").value = "37.0";
  setMood("");
  $("fluidsMl").value = "";
  $("customSymptoms").value = "";
  $("medication").value = "";
  $("food").value = "";
  $("sleep").value = "";
  $("diaperOrToilet").value = "";
  $("notes").value = "";
  $("deleteCurrent").classList.add("hidden");
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = false);
  document.querySelectorAll(".symptom-intensity").forEach(select => {
    select.value = "mittel";
    select.disabled = false;
  });
}

function selectedSymptoms() {
  return [...document.querySelectorAll("#symptomChips input:checked")].map(i => i.value);
}

function selectedSymptomIntensity() {
  const map = {};
  document.querySelectorAll("#symptomChips input:checked").forEach(input => {
    const select = document.querySelector(`.symptom-intensity[data-symptom="${CSS.escape(input.value)}"]`);
    if (select && select.value) map[input.value] = select.value;
  });
  return map;
}

function updateSymptomIntensityControls() {
  document.querySelectorAll("#symptomChips label").forEach(label => {
    const input = label.querySelector("input[type='checkbox']");
    const select = label.querySelector(".symptom-intensity");
    if (!input || !select) return;
    select.disabled = false;
    label.classList.toggle("with-intensity", true);
  });
}

function setSymptomIntensityMap(map = {}) {
  document.querySelectorAll("#symptomChips label").forEach(label => {
    const input = label.querySelector("input[type='checkbox']");
    const select = label.querySelector(".symptom-intensity");
    if (!input || !select) return;
    if (map[input.value]) select.value = map[input.value];
    else select.value = "mittel";
  });
  updateSymptomIntensityControls();
}

function setMood(value) {
  $("mood").value = value || "";
  document.querySelectorAll(".mood-option").forEach(btn => {
    const active = btn.dataset.mood === value;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", active ? "true" : "false");
  });
}

function setTemperatureValue(value, source = "input") {
  const input = $("temperature");
  const slider = $("temperatureSlider");

  if (value === "" || value === null || value === undefined) {
    if (source !== "slider") return;
    input.value = "";
    return;
  }

  const normalized = String(value).replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num)) return;

  if (source === "slider") {
    const rounded = Math.round(num * 10) / 10;
    input.value = rounded.toFixed(1);
    slider.value = Math.min(42, Math.max(34, rounded)).toFixed(1);
    return;
  }

  if (source === "blur") {
    const rounded = Math.round(num * 10) / 10;
    input.value = rounded.toFixed(1);
    slider.value = Math.min(42, Math.max(34, rounded)).toFixed(1);
    return;
  }

  // Beim normalen Tippen nicht formatieren, sonst springt der Cursor auf iOS/Android.
  slider.value = Math.min(42, Math.max(34, num)).toFixed(1);
}

function normalizeTimeInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return nowTime();

  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (!digits) return nowTime();

  let hours = "";
  let minutes = "";

  if (digits.length <= 2) {
    hours = digits;
    minutes = "00";
  } else {
    hours = digits.slice(0, 2);
    minutes = digits.slice(2, 4);
  }

  let h = Math.min(23, Math.max(0, Number(hours || "0")));
  let m = Math.min(59, Math.max(0, Number(minutes || "0")));

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTimeInputLive(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function fillTimePickerOptions() {
  const hour = $("timeHour");
  const minute = $("timeMinute");
  if (!hour || !minute || hour.dataset.filled === "true") return;

  hour.innerHTML = Array.from({ length: 24 }, (_, i) => {
    const value = String(i).padStart(2, "0");
    return `<option value="${value}">${value}</option>`;
  }).join("");

  minute.innerHTML = Array.from({ length: 60 }, (_, i) => {
    const value = String(i).padStart(2, "0");
    return `<option value="${value}">${value}</option>`;
  }).join("");

  hour.dataset.filled = "true";
  minute.dataset.filled = "true";
}

function updateTimePreview() {
  const hour = $("timeHour")?.value || "00";
  const minute = $("timeMinute")?.value || "00";
  const preview = $("timePreview");
  if (preview) preview.textContent = `${hour}:${minute}`;
}

function openTimePicker() {
  fillTimePickerOptions();

  const current = normalizeTimeInput($("entryTime").value || nowTime());
  const [hour, minute] = current.split(":");
  $("timeHour").value = hour;
  $("timeMinute").value = minute;
  updateTimePreview();

  const sheet = $("timeSheet");
  sheet.classList.remove("closing", "hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("time-open");
}

function closeTimePicker() {
  const sheet = $("timeSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("time-open");
  animateHide(sheet, "closing");
}

function applyTimePickerValue() {
  $("entryTime").value = `${$("timeHour").value}:${$("timeMinute").value}`;
  closeTimePicker();
}

function formEntry() {
  const temp = $("temperature").value;
  const fluids = $("fluidsMl").value;
  return {
    date: $("entryDate").value || state.selectedDate,
    time: normalizeTimeInput($("entryTime").value),
    temperature: temp === "" ? null : Number(temp),
    mood: $("mood").value,
    symptoms: selectedSymptoms(),
    symptom_intensity: selectedSymptomIntensity(),
    custom_symptoms: $("customSymptoms").value.trim(),
    medication: $("medication").value.trim(),
    fluids_ml: fluids === "" ? null : Number(fluids),
    food: $("food").value.trim(),
    sleep: $("sleep").value.trim(),
    diaper_or_toilet: $("diaperOrToilet").value.trim(),
    notes: $("notes").value.trim()
  };
}

function renderHistoryPopupContent(entry) {
  const history = Array.isArray(entry.history) ? [...entry.history] : [];
  const sorted = history.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));

  if (!sorted.length) {
    return `<div class="entry-history-empty"><span>↻</span><strong>Keine Historie vorhanden</strong><p>Für diesen Eintrag wurden noch keine Änderungen gespeichert.</p></div>`;
  }

  return `
    <div class="entry-history-list">
      ${sorted.map(event => `
        <div class="entry-history-row">
          <div class="entry-history-row-head">
            <span class="entry-history-action">${escapeHtml(historyActionLabel(event.action))}</span>
            <span class="entry-history-date">${escapeHtml(formatTimestamp(event.at) || "")}</span>
          </div>
          <div class="entry-history-user">${escapeHtml(userLabel(event.by))}</div>
          ${renderChangeDetails(event)}
        </div>
      `).join("")}
    </div>
  `;
}

function openEntryHistoryPopup(entryId) {
  const entry = (state.data.entries || []).find(e => e.id === entryId);
  if (!entry) return;

  $("entryHistoryTitle").textContent = "Historie";
  $("entryHistorySubtitle").textContent = `${entry.time || "--:--"} Uhr · ${formatDateShortGerman(entry.date || state.selectedDate)}`;
  $("entryHistoryContent").innerHTML = renderHistoryPopupContent(entry);

  const popup = $("entryHistoryPopup");
  popup.classList.remove("closing", "hidden");
  popup.setAttribute("aria-hidden", "false");
  document.body.classList.add("entry-history-open");
}

function closeEntryHistoryPopup() {
  const popup = $("entryHistoryPopup");
  if (!popup || popup.classList.contains("hidden")) return;
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("entry-history-open");
  animateHide(popup, "closing", () => {
    $("entryHistoryContent").innerHTML = "";
  });
}

function fieldEditConfig(field) {
  const configs = {
    medication: {
      title: "Medikamente",
      subtitle: "Nur Medikamente dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 3,
      placeholder: "Name, Dosis, Uhrzeit"
    },
    food: {
      title: "Essen",
      subtitle: "Nur Essen dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 3,
      placeholder: "Was wurde gegessen?"
    },
    sleep: {
      title: "Schlaf",
      subtitle: "Nur Schlaf dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 3,
      placeholder: "Dauer, Qualität, Auffälligkeiten"
    },
    diaper_or_toilet: {
      title: "Windel / Toilette",
      subtitle: "Nur Windel/Toilette dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 3,
      placeholder: "Urin, Stuhlgang, Auffälligkeiten"
    },
    notes: {
      title: "Notizen",
      subtitle: "Nur Notizen dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 4,
      placeholder: "Notiz"
    }
  };
  return configs[field] || null;
}

function openFieldEdit(entryId, field) {
  const entry = (state.data.entries || []).find(e => e.id === entryId);
  const config = fieldEditConfig(field);
  if (!entry || !config) return;

  $("fieldEditEntryId").value = entryId;
  $("fieldEditKey").value = field;
  $("fieldEditTitle").textContent = config.title;
  $("fieldEditSubtitle").textContent = config.subtitle;

  const value = entry[field] || "";
  $("fieldEditContent").innerHTML = `
    <label class="field field-edit-value">
      <span>${escapeHtml(config.title)}</span>
      <textarea id="fieldEditValue" rows="${config.rows}" placeholder="${escapeHtml(config.placeholder)}">${escapeHtml(value)}</textarea>
    </label>
  `;

  const sheet = $("fieldEditSheet");
  sheet.classList.remove("closing", "hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("field-edit-open");

  window.setTimeout(() => {
    const input = $("fieldEditValue");
    if (input) input.focus({ preventScroll: true });
  }, 220);
}

function closeFieldEdit() {
  const sheet = $("fieldEditSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("field-edit-open");
  animateHide(sheet, "closing", () => {
    $("fieldEditContent").innerHTML = "";
    $("fieldEditEntryId").value = "";
    $("fieldEditKey").value = "";
  });
}

async function deleteFieldEditEntry() {
  const entryId = $("fieldEditEntryId").value;
  if (!entryId) return;
  if (!confirm("Diesen Eintrag löschen?")) return;

  await api(`./api/entries/${entryId}`, { method: "DELETE" });
  await loadState();
  closeFieldEdit();
  showToast("Eintrag gelöscht");
}

async function saveFieldEdit(event) {
  event.preventDefault();

  const entryId = $("fieldEditEntryId").value;
  const field = $("fieldEditKey").value;
  const entry = (state.data.entries || []).find(e => e.id === entryId);
  if (!entry || !fieldEditConfig(field)) return;

  const payload = {
    date: entry.date,
    time: entry.time || nowTime(),
    temperature: entry.temperature ?? null,
    mood: entry.mood || "",
    symptoms: entry.symptoms || [],
    symptom_intensity: entry.symptom_intensity || {},
    custom_symptoms: entry.custom_symptoms || "",
    medication: entry.medication || "",
    fluids_ml: entry.fluids_ml ?? null,
    food: entry.food || "",
    sleep: entry.sleep || "",
    diaper_or_toilet: entry.diaper_or_toilet || "",
    notes: entry.notes || ""
  };

  payload[field] = $("fieldEditValue").value.trim();

  await api(`./api/entries/${entryId}`, { method: "PUT", body: JSON.stringify(payload) });
  state.selectedDate = payload.date || state.selectedDate;
  await loadState();
  closeFieldEdit();
  showToast("Aktualisiert");
}

function editEntry(id) {
  const entry = (state.data.entries || []).find(e => e.id === id);
  if (!entry) return;

  state.editingExistingEntry = true;
  $("entryId").value = entry.id;
  $("entryDate").value = entry.date || state.selectedDate;
  $("entryTime").value = entry.time || nowTime();
  $("entryFormTitle").textContent = "Eintrag bearbeiten";
  $("autoTimeText").textContent = "Datum und Uhrzeit können geändert werden";
  $("temperature").value = entry.temperature ?? "";
  if (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "") {
    setTemperatureValue(entry.temperature);
  } else {
    $("temperatureSlider").value = "37.0";
  }
  setMood(entry.mood || "");
  $("fluidsMl").value = entry.fluids_ml ?? "";
  $("customSymptoms").value = entry.custom_symptoms || "";
  $("medication").value = entry.medication || "";
  $("food").value = entry.food || "";
  $("sleep").value = entry.sleep || "";
  $("diaperOrToilet").value = entry.diaper_or_toilet || "";
  $("notes").value = entry.notes || "";
  $("deleteCurrent").classList.remove("hidden");
  document.querySelectorAll("#symptomChips input").forEach(i => i.checked = (entry.symptoms || []).includes(i.value));
  setSymptomIntensityMap(entry.symptom_intensity || {});
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

async function deleteEntry(id) {
  if (!id) return;
  if (!confirm("Diesen Eintrag löschen?")) return;
  await api(`./api/entries/${id}`, { method: "DELETE" });
  await loadState();
  showToast("Eintrag gelöscht");
}

function setDate(date) {
  state.selectedDate = date;
  state.dayExpanded = false;
  renderDay();
}

function openView(id) {
  document.body.classList.add("modal-open");
  document.querySelectorAll(".modal-view").forEach(v => {
    v.classList.remove("closing");
    v.classList.add("hidden");
  });
  const view = $(id);
  view.classList.remove("closing");
  view.classList.remove("hidden");
}

function closeViews() {
  const openViews = [...document.querySelectorAll(".modal-view:not(.hidden)")];
  document.body.classList.remove("modal-open");

  if (!openViews.length) return;

  openViews.forEach(v => {
    animateHide(v, "closing");
  });
}

async function init() {
  $("selectedDate").value = state.selectedDate;

  $("todayButton").addEventListener("click", () => setDate(today()));
  $("prevDay").addEventListener("click", () => setDate(addDays(state.selectedDate, -1)));
  $("nextDay").addEventListener("click", () => setDate(addDays(state.selectedDate, 1)));
  $("selectedDate").addEventListener("change", e => setDate(e.target.value || today()));

  $("datePickerButton").addEventListener("click", (event) => {
    if (event.target && event.target.id === "selectedDate") return;
    openSelectedDatePicker();
  });
  $("datePickerButton").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSelectedDatePicker();
    }
  });
  $("calendarBackdrop").addEventListener("click", closeCalendarSheet);
  $("calendarClose").addEventListener("click", closeCalendarSheet);
  $("calendarPrevMonth").addEventListener("click", () => {
    state.calendarMonth = addMonths(state.calendarMonth, -1);
    renderCalendar();
  });
  $("calendarNextMonth").addEventListener("click", () => {
    state.calendarMonth = addMonths(state.calendarMonth, 1);
    renderCalendar();
  });
  $("calendarToday").addEventListener("click", () => {
    setDate(today());
    closeCalendarSheet();
  });

  $("openEntry").addEventListener("click", () => {
    resetEntryForm();
    $("entryFormTitle").textContent = "Neuer Eintrag";
    openSheet();
  });
  $("closeEntry").addEventListener("click", closeSheet);
  $("sheetBackdrop").addEventListener("click", closeSheet);
  $("closeEntryHistory").addEventListener("click", closeEntryHistoryPopup);
  $("entryHistoryBackdrop").addEventListener("click", closeEntryHistoryPopup);
  $("closeDayDetail").addEventListener("click", closeDayDetailSheet);
  $("dayDetailBackdrop").addEventListener("click", closeDayDetailSheet);
  $("closeEntryDetailPopup").addEventListener("click", closeEntryDetailPopup);
  $("entryDetailPopupBackdrop").addEventListener("click", closeEntryDetailPopup);
  $("closeFieldEdit").addEventListener("click", closeFieldEdit);
  $("fieldEditBackdrop").addEventListener("click", closeFieldEdit);
  $("fieldEditForm").addEventListener("submit", saveFieldEdit);
  $("deleteFieldEdit").addEventListener("click", deleteFieldEditEntry);
  onIfExists("closeQuick", "click", closeQuickSheet);
  onIfExists("quickBackdrop", "click", closeQuickSheet);
  onIfExists("quickForm", "submit", async event => {
    event.preventDefault();
    const payload = quickPayload($("quickKind").value);
    if (!quickPayloadHasValue(payload)) {
      showToast("Kein Wert eingetragen");
      return;
    }
    await api("./api/entries", { method: "POST", body: JSON.stringify(payload) });
    await loadState();
    closeQuickSheet();
    showToast("Gespeichert");
  });
  $("deleteCurrent").addEventListener("click", deleteCurrentEntry);

  $("entryTime").addEventListener("input", event => {
    const cursorAtEnd = event.target.selectionStart === event.target.value.length;
    event.target.value = formatTimeInputLive(event.target.value);
    if (cursorAtEnd) event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
  });

  $("entryTime").addEventListener("blur", event => {
    event.target.value = normalizeTimeInput(event.target.value);
  });

  $("entryTime").addEventListener("click", openTimePicker);
  $("entryTime").addEventListener("focus", event => {
    event.target.blur();
    openTimePicker();
  });
  $("timeBackdrop").addEventListener("click", closeTimePicker);
  $("closeTimePicker").addEventListener("click", closeTimePicker);
  $("applyTimeButton").addEventListener("click", applyTimePickerValue);
  $("timeNowButton").addEventListener("click", () => {
    const [hour, minute] = nowTime().split(":");
    $("timeHour").value = hour;
    $("timeMinute").value = minute;
    updateTimePreview();
  });
  $("timeHour").addEventListener("change", updateTimePreview);
  $("timeMinute").addEventListener("change", updateTimePreview);

  document.querySelectorAll("#symptomChips input").forEach(input => {
    input.addEventListener("change", updateSymptomIntensityControls);
  });

  $("temperature").addEventListener("input", (event) => {
    setTemperatureValue(event.target.value, "input");
  });

  $("temperature").addEventListener("blur", (event) => {
    setTemperatureValue(event.target.value, "blur");
  });

  $("temperatureSlider").addEventListener("input", (event) => {
    setTemperatureValue(event.target.value, "slider");
  });

  document.querySelectorAll(".mood-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextMood = $("mood").value === btn.dataset.mood ? "" : btn.dataset.mood;
      setMood(nextMood);
    });
  });

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

    state.selectedDate = payload.date || state.selectedDate;
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

  $("themeSelect").addEventListener("change", (event) => {
    applyTheme(event.target.value);
    showToast("Theme geändert");
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
