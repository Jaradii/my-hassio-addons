const state = {
  config: {},
  data: { profile: {}, entries: [] },
  theme: localStorage.getItem("kindgesund_theme") || "babyblue",
  darkMode: localStorage.getItem("kindgesund_dark_mode") === "true",
  pin: localStorage.getItem("kindgesund_pin") || "",
  selectedDate: today(),
  calendarMonth: today().slice(0, 7),
  dayExpanded: false,
  editingExistingEntry: false,
  pendingSymptomImages: [],
  pendingQuickSymptomImages: [],
  pendingFieldEditSymptomImages: [],
  imagePreviewItems: [],
  imagePreviewIndex: 0
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


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

async function apiUploadImage(file) {
  const dataUrl = await fileToDataUrl(file);
  return api("./api/uploads/json", {
    method: "POST",
    body: JSON.stringify({
      name: file.name || "foto.jpg",
      content_type: file.type || "image/jpeg",
      data_url: dataUrl
    })
  });
}

function uploadUrlFromImage(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || (image.filename ? `./api/uploads/${image.filename}` : "");
}

function normalizeSymptomImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map(item => {
      if (typeof item === "string") return { url: item, filename: item.split("/").pop() || item };
      if (item && typeof item === "object") return item;
      return null;
    })
    .filter(Boolean);
}


function setImagePreviewIndex(index) {
  if (!state.imagePreviewItems.length) return;
  const max = state.imagePreviewItems.length - 1;
  state.imagePreviewIndex = Math.max(0, Math.min(max, Number(index) || 0));

  const img = $("imagePreviewLarge");
  const counter = $("imagePreviewCounter");
  const prev = $("imagePreviewPrev");
  const next = $("imagePreviewNext");
  const thumbs = $("imagePreviewThumbs");
  const url = state.imagePreviewItems[state.imagePreviewIndex];

  if (img) img.src = url;
  if (counter) counter.textContent = `${state.imagePreviewIndex + 1} / ${state.imagePreviewItems.length}`;
  if (prev) prev.classList.toggle("hidden", state.imagePreviewItems.length <= 1);
  if (next) next.classList.toggle("hidden", state.imagePreviewItems.length <= 1);

  if (thumbs) {
    thumbs.innerHTML = state.imagePreviewItems.length > 1 ? state.imagePreviewItems.map((itemUrl, idx) => `
      <button type="button" class="${idx === state.imagePreviewIndex ? "active" : ""}" data-index="${idx}" aria-label="Bild ${idx + 1} öffnen">
        <img src="${escapeHtml(itemUrl)}" alt="Foto ${idx + 1}" />
      </button>
    `).join("") : "";
    thumbs.querySelectorAll("button[data-index]").forEach(button => {
      button.addEventListener("click", () => setImagePreviewIndex(Number(button.dataset.index)));
    });
  }
}

function openImagePreviewPopup(url, images = [], index = 0) {
  const popup = $("imagePreviewPopup");
  if (!popup) return;

  const list = Array.isArray(images) && images.length ? images : [url].filter(Boolean);
  state.imagePreviewItems = list.filter(Boolean);
  state.imagePreviewIndex = 0;
  if (!state.imagePreviewItems.length) return;

  popup.classList.remove("closing", "hidden");
  popup.setAttribute("aria-hidden", "false");
  document.body.classList.add("image-preview-open");
  setImagePreviewIndex(index);
}

function closeImagePreviewPopup() {
  const popup = $("imagePreviewPopup");
  const img = $("imagePreviewLarge");
  if (!popup || popup.classList.contains("hidden")) return;

  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("image-preview-open");
  animateHide(popup, "closing", () => {
    if (img) img.src = "";
    if ($("imagePreviewThumbs")) $("imagePreviewThumbs").innerHTML = "";
    state.imagePreviewItems = [];
    state.imagePreviewIndex = 0;
  });
}

function bindSymptomImageOpeners(root = document) {
  root.querySelectorAll(".symptom-image-open").forEach(button => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      let images = [];
      try {
        images = JSON.parse(button.dataset.images || "[]");
      } catch {
        images = [];
      }
      openImagePreviewPopup(button.dataset.url, images, Number(button.dataset.index || 0));
    });
  });
}

async function shareCurrentImagePreview() {
  const url = state.imagePreviewItems[state.imagePreviewIndex];
  if (!url) return;

  try {
    const absoluteUrl = new URL(url, window.location.href).toString();
    const response = await fetch(absoluteUrl);
    const blob = await response.blob();
    const filename = absoluteUrl.split("/").pop()?.split("?")[0] || "symptom-foto.jpg";
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title: "Symptom-Foto",
        text: "Symptom-Foto aus dem Gesundheitstracker"
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "Symptom-Foto",
        text: "Symptom-Foto aus dem Gesundheitstracker",
        url: absoluteUrl
      });
      return;
    }

    showToast("Teilen wird hier nicht unterstützt");
  } catch (err) {
    showToast("Teilen nicht möglich");
  }
}

function renderSymptomImages(images) {
  const normalized = normalizeSymptomImages(images);
  if (!normalized.length) return "";
  const urls = normalized.map(uploadUrlFromImage).filter(Boolean);

  return `
    <div class="symptom-image-strip">
      ${urls.map((url, index) => {
        return `<button type="button" class="symptom-image-open" data-url="${escapeHtml(url)}" data-images="${escapeHtml(JSON.stringify(urls))}" data-index="${index}" aria-label="Symptom-Foto öffnen"><img src="${escapeHtml(url)}" alt="Symptom-Foto" loading="lazy" /></button>`;
      }).join("")}
    </div>
  `;
}

function renderPendingSymptomImages(targetId, images, target = "main") {
  const el = $(targetId);
  if (!el) return;
  const normalized = normalizeSymptomImages(images);
  el.innerHTML = normalized.length ? `
    ${normalized.map((image, index) => `
      <div class="symptom-image-pending">
        <img src="${escapeHtml(uploadUrlFromImage(image))}" alt="Ausgewähltes Foto" />
        <button type="button" data-index="${index}" aria-label="Foto entfernen">×</button>
      </div>
    `).join("")}
  ` : "";

  el.querySelectorAll("button[data-index]").forEach(button => {
    button.addEventListener("click", () => {
      const idx = Number(button.dataset.index);
      if (target === "quick") {
        state.pendingQuickSymptomImages.splice(idx, 1);
        renderPendingSymptomImages(targetId, state.pendingQuickSymptomImages, "quick");
      } else if (target === "field") {
        state.pendingFieldEditSymptomImages.splice(idx, 1);
        renderPendingSymptomImages(targetId, state.pendingFieldEditSymptomImages, "field");
      } else {
        state.pendingSymptomImages.splice(idx, 1);
        renderPendingSymptomImages(targetId, state.pendingSymptomImages, "main");
      }
    });
  });
}

async function handleSymptomImageFiles(files, target = "main") {
  const list = [...(files || [])].filter(file => file && file.type && file.type.startsWith("image/"));
  if (!list.length) {
    showToast("Keine Bilddatei ausgewählt");
    return;
  }

  showToast("Foto wird hochgeladen...");
  for (const file of list) {
    const uploaded = await apiUploadImage(file);
    if (target === "quick") state.pendingQuickSymptomImages.push(uploaded);
    else if (target === "field") state.pendingFieldEditSymptomImages.push(uploaded);
    else state.pendingSymptomImages.push(uploaded);
  }

  if (target === "quick") renderPendingSymptomImages("quickSymptomImagePreview", state.pendingQuickSymptomImages, "quick");
  else if (target === "field") renderPendingSymptomImages("fieldEditSymptomImagePreview", state.pendingFieldEditSymptomImages, "field");
  else renderPendingSymptomImages("symptomImagePreview", state.pendingSymptomImages, "main");
  showToast(list.length === 1 ? "Foto hinzugefügt" : "Fotos hinzugefügt");
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

function applyDarkMode(enabled) {
  state.darkMode = Boolean(enabled);
  document.body.classList.toggle("dark", state.darkMode);
  localStorage.setItem("kindgesund_dark_mode", state.darkMode ? "true" : "false");

  const toggle = $("darkModeToggle");
  if (toggle) toggle.checked = state.darkMode;

  const topButton = $("topDarkModeButton");
  if (topButton) {
    topButton.textContent = state.darkMode ? "☀️" : "🌙";
    topButton.setAttribute("aria-label", state.darkMode ? "Light Mode aktivieren" : "Dark Mode aktivieren");
    topButton.setAttribute("title", state.darkMode ? "Light Mode" : "Dark Mode");
    topButton.classList.toggle("active", state.darkMode);
  }

  syncMenuDarkModeButton();
}

function applyTheme(theme) {
  const allowed = [
    "babyblue", "mint", "lavender", "peach", "rose", "slate", "darkslate",
    "ocean", "forest", "sand", "berry", "mono",
    "midnight", "graphite", "nordnight", "mossdark", "mochadark", "aubergine"
  ];
  const next = allowed.includes(theme) ? theme : "babyblue";
  state.theme = next;
  document.body.dataset.theme = next;
  localStorage.setItem("kindgesund_theme", next);

  const oldSelector = $("themeSelect");
  if (oldSelector) oldSelector.value = next;

  const popupSelector = $("themePopupSelect");
  if (popupSelector) popupSelector.value = next;
}

async function loadConfig() {
  state.config = await api("./api/config", { headers: {} });
  document.title = state.config.app_title || "Gesundheitstracker";

  const storedDarkMode = localStorage.getItem("kindgesund_dark_mode");
  if (storedDarkMode === null && state.config.dark_mode !== undefined) {
    applyDarkMode(Boolean(state.config.dark_mode));
  } else {
    applyDarkMode(state.darkMode);
  }

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
  if ($("darkModeToggle")) $("darkModeToggle").checked = state.darkMode;
  const themeSelector = $("themeSelect");
  if (themeSelector) themeSelector.value = state.theme;
  const popupThemeSelector = $("themePopupSelect");
  if (popupThemeSelector) popupThemeSelector.value = state.theme;
}

function selectedEntries() {
  const entries = state.data.entries || [];
  const current = entries.filter(e => e.date === state.selectedDate);
  const carries = entries
    .filter(e => e.date === previousDateString(state.selectedDate))
    .map(e => overnightCarryEntry(e, state.selectedDate))
    .filter(Boolean);

  return [...current, ...carries]
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
  bindSleepTimeInputs(document);

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
  container.querySelectorAll(".category-compact-more").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".category-compact-card");
      if (!card) return;
      const expanded = btn.dataset.expanded === "true";
      btn.dataset.expanded = expanded ? "false" : "true";
      card.dataset.expanded = expanded ? "false" : "true";
      card.querySelectorAll(".category-extra-item").forEach(item => {
        item.classList.toggle("category-extra-hidden", expanded);
      });
      const hiddenTotal = card.querySelectorAll(".category-extra-item").length;
      btn.textContent = expanded ? `Weitere ${hiddenTotal} anzeigen` : "Weniger anzeigen";
    });
  });
  container.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
  });
  container.querySelectorAll(".quick-tile").forEach(tile => {
    tile.addEventListener("click", () => openQuickEntry(tile.dataset.quick));
  });
  bindSymptomImageOpeners(container);
}

function entryDateTimeValue(entry) {
  const date = String(entry?.date || state.selectedDate || today()).trim();
  const rawTime = String(entry?.time || "00:00").trim();

  const match = rawTime.match(/(\d{1,2})[:.](\d{1,2})/);
  let hours = 0;
  let minutes = 0;

  if (match) {
    hours = Math.min(23, Math.max(0, Number(match[1]) || 0));
    minutes = Math.min(59, Math.max(0, Number(match[2]) || 0));
  } else {
    const digits = rawTime.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
      hours = Math.min(23, Math.max(0, Number(digits || "0")));
    } else {
      hours = Math.min(23, Math.max(0, Number(digits.slice(0, 2)) || 0));
      minutes = Math.min(59, Math.max(0, Number(digits.slice(2, 4)) || 0));
    }
  }

  const timestamp = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`).getTime();
  if (!Number.isNaN(timestamp)) return timestamp;

  const updated = new Date(entry?.updated_at || entry?.created_at || 0).getTime();
  return Number.isNaN(updated) ? 0 : updated;
}

function buildDaySummary(entries) {
  const fluidsTotal = entries.reduce((sum, e) => sum + (Number(e.fluids_ml) || 0), 0);
  const temperatures = entries
    .map(e => e.temperature)
    .filter(v => v !== null && v !== undefined && v !== "")
    .map(Number)
    .filter(v => !Number.isNaN(v));

  const temperatureEntriesForLatest = entries
    .filter(e => e.temperature !== null && e.temperature !== undefined && e.temperature !== "")
    .map((entry, index) => ({ entry, index, timestamp: entryDateTimeValue(entry) }))
    .sort((a, b) => (b.timestamp - a.timestamp) || (b.index - a.index));

  const latestTempEntry = temperatureEntriesForLatest[0]?.entry || null;
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

  const symptomEntries = entries.filter(e =>
    (e.symptoms && e.symptoms.length) || String(e.custom_symptoms || "").trim()
  );

  const fluidEntries = entries.filter(e => e.fluids_ml);
  const temperatureEntries = entries.filter(e => e.temperature !== null && e.temperature !== undefined && e.temperature !== "");
  const moods = entries.filter(e => e.mood);
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
    symptomEntries,
    fluidEntries,
    temperatureEntries,
    moods,
    medications,
    foods,
    sleeps,
    diaper,
    notes
  };
}

function tileCountText(count, singular, plural = null, emptyText = "Keine") {
  const value = Number(count) || 0;
  if (!value) return emptyText;
  return `${value} ${value === 1 ? singular : (plural || `${singular}e`)}`;
}

function tileFluidText(totalMl) {
  const value = Number(totalMl) || 0;
  if (!value) return "Keine";
  return `${value} ml`;
}

function tileTempText(entry) {
  if (!entry) return "Keine";
  return `${Number(entry.temperature).toFixed(1)} °C`;
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
    ? escapeHtml(summary.moods[0].mood)
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

      <div class="day-tile-grid compact-day-tile-grid">
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="fluids" aria-label="Flüssigkeit eintragen">
          <span class="tile-icon">💧</span>
          <span class="tile-label">Flüssigkeit</span>
          <strong>${tileFluidText(summary.fluidsTotal)}</strong>
          <small>${summary.fluidEntries.length ? `${summary.fluidEntries.length} Einträge` : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="food" aria-label="Essen eintragen">
          <span class="tile-icon">🍽️</span>
          <span class="tile-label">Essen</span>
          <strong>${tileCountText(summary.foods.length, "Essen", "Essen")}</strong>
          <small>${summary.foods.length ? "Einträge" : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile temperature-tile ${summary.latestTempEntry ? feverClass(summary.latestTempEntry.temperature) : ""}" data-quick="temperature" aria-label="Fieber / Temperatur eintragen">
          <span class="tile-icon">🌡️</span>
          <span class="tile-label">Fieber</span>
          <strong>${escapeHtml(tileTempText(summary.latestTempEntry))}</strong>
          <small>${escapeHtml(tempMeta)}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="sleep" aria-label="Schlaf eintragen">
          <span class="tile-icon">😴</span>
          <span class="tile-label">Schlaf</span>
          <strong>${tileCountText(summary.sleeps.length, "Schlaf", "Schlaf")}</strong>
          <small>${summary.sleeps.length ? "Einträge" : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="symptoms" aria-label="Symptome eintragen">
          <span class="tile-icon">🤧</span>
          <span class="tile-label">Symptome</span>
          <strong>${tileCountText(summary.symptoms.length, "Symptom", "Symptome")}</strong>
          <small>${symptomText}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="mood" aria-label="Stimmung eintragen">
          <span class="tile-icon">🙂</span>
          <span class="tile-label">Stimmung</span>
          <strong>${tileCountText(summary.moods.length, "Stimmung", "Stimmungen")}</strong>
          <small>${summary.moods.length ? "Angaben" : "Keine Angabe"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="diaper_or_toilet" aria-label="Windel oder Toilette eintragen">
          <span class="tile-icon">🚽</span>
          <span class="tile-label">Windel/Toilette</span>
          <strong>${tileCountText(summary.diaper.length, "Eintrag", "Einträge")}</strong>
          <small>${summary.diaper.length ? "Einträge" : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="medication" aria-label="Medikament eintragen">
          <span class="tile-icon">💊</span>
          <span class="tile-label">Medis</span>
          <strong>${tileCountText(summary.medications.length, "Medikament", "Medikamente")}</strong>
          <small>${summary.medications.length ? "Einträge" : "Nicht eingetragen"}</small>
        </button>
        <button type="button" class="day-tile quick-tile compact-day-tile" data-quick="notes" aria-label="Notiz oder Auffälligkeit eintragen">
          <span class="tile-icon">📝</span>
          <span class="tile-label">Notizen</span>
          <strong>${tileCountText(summary.notes.length, "Notiz", "Notizen")}</strong>
          <small>${summary.notes.length ? "Auffälligkeiten" : "Keine Notiz"}</small>
        </button>
      </div>



      ${renderSummaryTextBlocks(summary)}


    </article>
  `;
}

function summaryDisplayValue(entry, key) {
  if (key === "fluids_ml") return `${entry.fluids_ml} ml`;
  if (key === "temperature") return `${Number(entry.temperature).toFixed(1)} °C`;
  if (key === "symptoms") {
    const intensityMap = entry.symptom_intensity || {};
    const symptomParts = (entry.symptoms || []).map(symptom => {
      const level = intensityMap[symptom];
      return level ? `${symptom} (${level})` : symptom;
    });
    if (entry.custom_symptoms) {
      symptomParts.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));
    }
    return symptomParts.join(", ");
  }
  return entry[key] || "";
}

function renderSummaryTextBlocks(summary) {
  const groups = [
    { items: summary.symptomEntries, key: "symptoms", icon: "🤧", title: "Symptome" },
    { items: summary.fluidEntries, key: "fluids_ml", icon: "💧", title: "Flüssigkeit" },
    { items: summary.temperatureEntries, key: "temperature", icon: "🌡️", title: "Temperatur / Fieber" },
    { items: summary.moods, key: "mood", icon: "🙂", title: "Stimmung" },
    { items: summary.medications, key: "medication", icon: "💊", title: "Medikamente" },
    { items: summary.foods, key: "food", icon: "🍽️", title: "Essen" },
    { items: summary.sleeps, key: "sleep", icon: "😴", title: "Schlaf" },
    { items: summary.diaper, key: "diaper_or_toilet", icon: "🚽", title: "Windel / Toilette" },
    { items: summary.notes, key: "notes", icon: "📝", title: "Notizen" }
  ]
    .map(group => ({
      ...group,
      items: [...group.items].sort((a, b) => (b.time || "").localeCompare(a.time || ""))
    }))
    .filter(group => group.items.length);

  if (!groups.length) {
    return `
      <section class="category-compact-empty">
        <span>＋</span>
        <strong>Noch keine Details eingetragen</strong>
        <p>Tippe auf eine Kachel oder den Plus-Button, um etwas einzutragen.</p>
      </section>
    `;
  }

  const limit = 3;

  const renderItem = (group, entry, hidden = false) => `
    <div class="summary-info-item category-compact-item ${group.key === "temperature" ? feverClass(entry.temperature) : ""} ${entry.is_overnight_carry ? "overnight-carry-item" : ""} ${hidden ? "category-extra-item category-extra-hidden" : ""}">
      <span class="summary-info-time">${escapeHtml(entry.time || "--:--")}</span>
      <p>${escapeHtml(summaryDisplayValue(entry, group.key))}${group.key === "symptoms" ? renderCompactSymptomImages(entry.symptom_images || []) : ""}</p>
      <div class="summary-row-actions">
        <button type="button" class="summary-edit-button summary-history-button" data-id="${entry.original_id || entry.id}" aria-label="Historie anzeigen">↻</button>
        <button type="button" class="summary-edit-button edit-summary-field" data-id="${entry.original_id || entry.id}" data-field="${group.key}" aria-label="${group.title} bearbeiten">✎</button>
      </div>
    </div>
  `;

  return `
    <section class="category-compact-list">
      ${groups.map(group => {
        const shown = group.items.slice(0, limit);
        const hidden = group.items.slice(limit);
        return `
          <section class="category-compact-card" data-expanded="false">
            <div class="category-compact-head">
              <span class="category-compact-icon">${group.icon}</span>
              <strong>${group.title}</strong>
              <em>${group.items.length} ${group.items.length === 1 ? "Eintrag" : "Einträge"}</em>
            </div>
            <div class="summary-info-list category-compact-items">
              ${shown.map(entry => renderItem(group, entry)).join("")}
              ${hidden.map(entry => renderItem(group, entry, true)).join("")}
            </div>
            ${hidden.length ? `<button type="button" class="category-compact-more" data-expanded="false">Weitere ${hidden.length} anzeigen</button>` : ""}
          </section>
        `;
      }).join("")}
    </section>
  `;
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

  bindSymptomImageOpeners($("entryDetailPopupContent"));
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
            ${renderSymptomImages(entry.symptom_images || [])}
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
      <label><input type="checkbox" value="Halsschmerzen"><span class="symptom-icon">🗣️</span><span>Halsschmerzen</span><select class="quick-symptom-intensity" data-symptom="Halsschmerzen" aria-label="Intensität Halsschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Ohrenschmerzen"><span class="symptom-icon">👂</span><span>Ohrenschmerzen</span><select class="quick-symptom-intensity" data-symptom="Ohrenschmerzen" aria-label="Intensität Ohrenschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Bauchschmerzen"><span class="symptom-icon">🤢</span><span>Bauchschmerzen</span><select class="quick-symptom-intensity" data-symptom="Bauchschmerzen" aria-label="Intensität Bauchschmerzen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Durchfall"><span class="symptom-icon">🚽</span><span>Durchfall</span><select class="quick-symptom-intensity" data-symptom="Durchfall" aria-label="Intensität Durchfall"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Erbrechen"><span class="symptom-icon">🤮</span><span>Erbrechen</span><select class="quick-symptom-intensity" data-symptom="Erbrechen" aria-label="Intensität Erbrechen"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Ausschlag"><span class="symptom-icon">🩹</span><span>Ausschlag</span><select class="quick-symptom-intensity" data-symptom="Ausschlag" aria-label="Intensität Ausschlag"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
      <label><input type="checkbox" value="Appetitlosigkeit"><span class="symptom-icon">🍽️</span><span>Appetitlosigkeit</span><select class="quick-symptom-intensity" data-symptom="Appetitlosigkeit" aria-label="Intensität Appetitlosigkeit"><option value="leicht">leicht</option><option value="mittel" selected>mittel</option><option value="stark">stark</option></select></label>
    </div>
    <label class="field quick-field"><span>Weitere Symptome</span><input id="quickCustomSymptoms" type="text" placeholder="optional"></label>
    <div class="symptom-photo-box visible-symptom-photo-box">
      <input id="quickSymptomImageInput" type="file" accept="image/*" multiple />
      <button id="quickSymptomImageButton" type="button" class="symptom-photo-button">📷 Foto hinzufügen</button>
      <div id="quickSymptomImagePreview" class="symptom-image-preview"></div>
    </div>
  `;
  const defs = {
    fluids: { title: "Flüssigkeit", subtitle: "Getrunkene Menge in ml eintragen.", content: `<label class="field quick-field"><span>Flüssigkeit in ml</span><input id="quickFluidsMl" type="number" min="0" step="10" inputmode="numeric" placeholder="z. B. 250"></label>` },
    temperature: { title: "Temperatur", subtitle: "Temperatur für diesen Tag speichern.", content: `<label class="field quick-field"><span>Temperatur in °C</span><input id="quickTemperature" type="number" step="0.1" min="30" max="45" placeholder="z. B. 38,5"><input id="quickTemperatureSlider" class="temperature-slider" type="range" min="34" max="42" step="0.1" value="37.0"><div class="slider-scale"><span>34°</span><span>37°</span><span>39°</span><span>42°</span></div></label>` },
    mood: { title: "Stimmung", subtitle: "Eine oder mehrere Stimmungen auswählen.", content: `<input id="quickMood" type="hidden"><div id="quickMoodOptions" class="mood-options quick-mood-options"><button type="button" class="mood-option" data-mood="Gut drauf"><span>😊</span><small>Gut</small></button><button type="button" class="mood-option" data-mood="Müde"><span>😴</span><small>Müde</small></button><button type="button" class="mood-option" data-mood="Quengelig"><span>😣</span><small>Quengelig</small></button><button type="button" class="mood-option" data-mood="Schlapp"><span>🥱</span><small>Schlapp</small></button><button type="button" class="mood-option" data-mood="Schmerzen"><span>🤕</span><small>Schmerz</small></button><button type="button" class="mood-option" data-mood="Unruhig"><span>😟</span><small>Unruhig</small></button></div>` },
    symptoms: { title: "Symptome", subtitle: "Ein oder mehrere Symptome auswählen.", content: symptomsHtml },
    medication: { title: "Medikamente", subtitle: "Medikament, Dosis oder Uhrzeit notieren.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">💊</span>Medikamente</span><textarea id="quickMedication" rows="3" placeholder="Name, Dosis, Uhrzeit"></textarea></label>` },
    food: { title: "Essen", subtitle: "Essen kurz eintragen.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">🍽️</span>Essen</span><textarea id="quickFood" rows="3" placeholder="Was wurde gegessen?"></textarea></label>` },
    sleep: { title: "Schlaf", subtitle: "Schlaf kurz eintragen.", content: `<div class="field quick-field sleep-duration-field"><span><span class="field-icon">😴</span>Schlaf</span><div class="sleep-time-grid"><label><small>Von</small><input id="quickSleepStart" type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" /></label><label><small>Bis</small><input id="quickSleepEnd" type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" /></label></div><div id="quickSleepDurationPreview" class="sleep-duration-preview hidden"></div><textarea id="quickSleep" rows="3" placeholder="Qualität, Auffälligkeiten"></textarea></div>` },
    diaper_or_toilet: { title: "Windel / Toilette", subtitle: "Windel oder Toilettengang kurz eintragen.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">🚽</span>Windel / Toilette</span><textarea id="quickDiaperOrToilet" rows="3" placeholder="z. B. nass, Stuhlgang, Toilette, Auffälligkeiten"></textarea></label>` },
    notes: { title: "Notizen / Auffälligkeiten", subtitle: "Sonstige Beobachtung kurz notieren.", content: `<label class="field quick-field icon-textarea-field"><span><span class="field-icon">📝</span>Notiz / Auffälligkeit</span><textarea id="quickNotes" rows="3" placeholder="Was ist aufgefallen?"></textarea></label>` }
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
  state.pendingQuickSymptomImages = [];
  renderPendingSymptomImages("quickSymptomImagePreview", state.pendingQuickSymptomImages, "quick");
  if ($("quickSymptomImageButton")) $("quickSymptomImageButton").addEventListener("click", () => $("quickSymptomImageInput").click());
  if ($("quickSymptomImageInput")) {
    $("quickSymptomImageInput").addEventListener("change", async event => {
      await handleSymptomImageFiles(event.target.files, "quick");
      event.target.value = "";
    });
  }
  bindSleepTimeInputs($("quickContent"));
  updateQuickSleepDurationPreview();
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
        const values = parseMoodValues($("quickMood").value);
        const next = values.includes(btn.dataset.mood)
          ? values.filter(item => item !== btn.dataset.mood)
          : [...values, btn.dataset.mood];

        $("quickMood").value = serializeMoodValues(next);
        $("quickContent").querySelectorAll(".mood-option").forEach(item => {
          item.classList.toggle("active", next.includes(item.dataset.mood));
        });
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
    payload.symptom_images = [...state.pendingQuickSymptomImages];
  } else if (kind === "medication") {
    payload.medication = $("quickMedication").value.trim();
  } else if (kind === "food") {
    payload.food = $("quickFood").value.trim();
  } else if (kind === "sleep") {
    payload.sleep = buildSleepText($("quickSleep").value, $("quickSleepStart")?.value || "", $("quickSleepEnd")?.value || "");
  } else if (kind === "diaper_or_toilet") {
    payload.diaper_or_toilet = $("quickDiaperOrToilet").value.trim();
  } else if (kind === "notes") {
    payload.notes = $("quickNotes").value.trim();
  }
  return payload;
}

function quickPayloadHasValue(payload) {
  return [payload.temperature !== null && !Number.isNaN(payload.temperature), payload.fluids_ml !== null && !Number.isNaN(payload.fluids_ml), payload.mood, payload.symptoms.length, payload.custom_symptoms, payload.medication, payload.food, payload.sleep, payload.diaper_or_toilet, payload.notes, (payload.symptom_images || []).length].some(Boolean);
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
  if ($("sleepStart")) $("sleepStart").value = "";
  if ($("sleepEnd")) $("sleepEnd").value = "";
  updateSleepDurationPreview();
  $("diaperOrToilet").value = "";
  $("notes").value = "";
  state.pendingSymptomImages = [];
  renderPendingSymptomImages("symptomImagePreview", state.pendingSymptomImages, "main");
  if ($("symptomImageInput")) $("symptomImageInput").value = "";
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

function parseMoodValues(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function serializeMoodValues(values) {
  return [...new Set((values || []).map(item => String(item || "").trim()).filter(Boolean))].join(", ");
}

function setMood(value) {
  const values = parseMoodValues(value);
  $("mood").value = serializeMoodValues(values);
  document.querySelectorAll("#moodOptions .mood-option").forEach(btn => {
    const active = values.includes(btn.dataset.mood);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", active ? "true" : "false");
  });
}

function toggleMood(value) {
  const values = parseMoodValues($("mood").value);
  const next = values.includes(value)
    ? values.filter(item => item !== value)
    : [...values, value];
  setMood(serializeMoodValues(next));
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


function minutesFromTimeString(value) {
  const normalized = normalizeTimeInput(value || "");
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return (Number(match[1]) * 60) + Number(match[2]);
}

function formatSleepDurationMinutes(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "";
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

function calculateSleepDuration(startValue, endValue) {
  const start = minutesFromTimeString(startValue);
  const end = minutesFromTimeString(endValue);
  if (start === null || end === null) return null;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return diff;
}


function isOvernightSleepRange(startValue, endValue) {
  const start = minutesFromTimeString(startValue);
  const end = minutesFromTimeString(endValue);
  return start !== null && end !== null && end < start;
}

function extractSleepRange(text) {
  const match = String(text || "").match(/Von\s+(\d{1,2}:\d{2})\s+bis\s+(\d{1,2}:\d{2})/i);
  if (!match) return null;
  return {
    start: normalizeTimeInput(match[1]),
    end: normalizeTimeInput(match[2])
  };
}

function nextDateString(dateStr) {
  return addDays(dateStr, 1);
}

function previousDateString(dateStr) {
  return addDays(dateStr, -1);
}

function overnightCarryEntry(entry, selectedDate) {
  if (!entry || !entry.sleep || !entry.date) return null;
  const range = extractSleepRange(entry.sleep);
  if (!range || !isOvernightSleepRange(range.start, range.end)) return null;
  if (nextDateString(entry.date) !== selectedDate) return null;

  const end = minutesFromTimeString(range.end);
  if (end === null || end <= 0) return null;

  const textRest = stripGeneratedSleepDuration(entry.sleep);
  return {
    ...entry,
    id: `${entry.id || "sleep"}__overnight`,
    original_id: entry.id,
    date: selectedDate,
    time: "00:00",
    sleep: `Nachtschlaf von gestern: 00:00 bis ${range.end} (${formatSleepDurationMinutes(end)})${textRest ? ` · ${textRest}` : ""}`,
    is_overnight_carry: true
  };
}

function overnightStartText(startValue) {
  const start = minutesFromTimeString(startValue);
  if (start === null) return "";
  return formatSleepDurationMinutes((24 * 60) - start);
}

function buildSleepText(baseText, startValue, endValue) {
  const start = normalizeTimeInput(startValue || "");
  const end = normalizeTimeInput(endValue || "");
  const duration = calculateSleepDuration(start, end);
  const durationText = duration ? formatSleepDurationMinutes(duration) : "";
  const parts = [];
  if (start && end && durationText) {
    const overnight = isOvernightSleepRange(start, end);
    parts.push(`Von ${start} bis ${end} (${durationText}${overnight ? ", bis nächster Tag" : ""})`);
  }
  const base = String(baseText || "").trim();
  if (base) parts.push(base);
  return parts.join(" · ");
}

function updateSleepDurationPreview() {
  const preview = $("sleepDurationPreview");
  if (!preview) return;
  const duration = calculateSleepDuration($("sleepStart")?.value || "", $("sleepEnd")?.value || "");
  if (!duration) {
    preview.classList.add("hidden");
    preview.textContent = "";
    return;
  }
  preview.textContent = `Dauer: ${formatSleepDurationMinutes(duration)}`;
  preview.classList.remove("hidden");
}


function stripGeneratedSleepDuration(text) {
  return String(text || "")
    .replace(/^Von\s+\d{1,2}:\d{2}\s+bis\s+\d{1,2}:\d{2}\s+\([^)]*\)\s*·\s*/i, "")
    .replace(/^Von\s+\d{1,2}:\d{2}\s+bis\s+\d{1,2}:\d{2}\s+\([^)]*\)\s*/i, "")
    .trim();
}


function bindFieldEditSleepInputs() {
  ["fieldEditSleepStart", "fieldEditSleepEnd"].forEach(id => {
    const input = $(id);
    if (!input || input.dataset.fieldSleepBound === "1") return;
    input.dataset.fieldSleepBound = "1";
    input.addEventListener("input", event => {
      const cursorAtEnd = event.target.selectionStart === event.target.value.length;
      event.target.value = formatTimeInputLive(event.target.value);
      if (cursorAtEnd) event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
      updateFieldEditSleepDurationPreview();
    });
    input.addEventListener("blur", event => {
      event.target.value = normalizeTimeInput(event.target.value);
      updateFieldEditSleepDurationPreview();
    });
  });
}

function updateFieldEditSleepDurationPreview() {
  const preview = $("fieldEditSleepDurationPreview");
  if (!preview) return;
  const duration = calculateSleepDuration($("fieldEditSleepStart")?.value || "", $("fieldEditSleepEnd")?.value || "");
  if (!duration) {
    preview.classList.add("hidden");
    preview.textContent = "";
    return;
  }
  preview.textContent = `Dauer: ${formatSleepDurationMinutes(duration)}`;
  preview.classList.remove("hidden");
}

function updateQuickSleepDurationPreview() {
  const preview = $("quickSleepDurationPreview");
  if (!preview) return;
  const duration = calculateSleepDuration($("quickSleepStart")?.value || "", $("quickSleepEnd")?.value || "");
  if (!duration) {
    preview.classList.add("hidden");
    preview.textContent = "";
    return;
  }
  preview.textContent = `Dauer: ${formatSleepDurationMinutes(duration)}`;
  preview.classList.remove("hidden");
}

function bindSleepTimeInputs(root = document) {
  root.querySelectorAll("#sleepStart, #sleepEnd, #quickSleepStart, #quickSleepEnd").forEach(input => {
    if (input.dataset.sleepBound === "1") return;
    input.dataset.sleepBound = "1";
    input.addEventListener("input", event => {
      const cursorAtEnd = event.target.selectionStart === event.target.value.length;
      event.target.value = formatTimeInputLive(event.target.value);
      if (cursorAtEnd) event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
      updateSleepDurationPreview();
      updateQuickSleepDurationPreview();
      updateFieldEditSleepDurationPreview();
    });
    input.addEventListener("blur", event => {
      event.target.value = normalizeTimeInput(event.target.value);
      updateSleepDurationPreview();
      updateQuickSleepDurationPreview();
      updateFieldEditSleepDurationPreview();
    });
  });
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
    sleep: buildSleepText($("sleep").value, $("sleepStart")?.value || "", $("sleepEnd")?.value || ""),
    diaper_or_toilet: $("diaperOrToilet").value.trim(),
    notes: $("notes").value.trim(),
    symptom_images: [...state.pendingSymptomImages]
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
    fluids_ml: {
      title: "Flüssigkeit",
      subtitle: "Nur Flüssigkeit dieses Eintrags bearbeiten.",
      input: "number",
      placeholder: "z. B. 250"
    },
    temperature: {
      title: "Temperatur",
      subtitle: "Nur Temperatur dieses Eintrags bearbeiten.",
      input: "number",
      placeholder: "z. B. 38.5"
    },
    symptoms: {
      title: "Symptome",
      subtitle: "Nur Symptome dieses Eintrags bearbeiten.",
      input: "symptoms",
      rows: 2,
      placeholder: "Weitere Symptome"
    },
    mood: {
      title: "Stimmung",
      subtitle: "Nur Stimmung dieses Eintrags bearbeiten.",
      input: "textarea",
      rows: 2,
      placeholder: "z. B. Müde, Gut drauf, Quengelig"
    },
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
  const timeFieldHtml = `
    <label class="field field-edit-time">
      <span>Uhrzeit</span>
      <input id="fieldEditTime" type="text" inputmode="numeric" autocomplete="off" placeholder="HH:MM" maxlength="5" value="${escapeHtml(entry.time || nowTime())}" />
    </label>
  `;

  if (field === "symptoms") {
    const selected = entry.symptoms || [];
    const intensityMap = entry.symptom_intensity || {};
    const symptomOptions = ["Fieber", "Husten", "Schnupfen", "Halsschmerzen", "Ohrenschmerzen", "Bauchschmerzen", "Durchfall", "Erbrechen", "Ausschlag", "Appetitlosigkeit"];

    $("fieldEditContent").innerHTML = `
      ${timeFieldHtml}
      <div id="fieldEditSymptomChips" class="quick-symptom-grid field-edit-symptom-grid">
        ${symptomOptions.map(symptom => `
          <label>
            <input type="checkbox" value="${escapeHtml(symptom)}" ${selected.includes(symptom) ? "checked" : ""}>
            <span class="symptom-icon">${symptomIcon(symptom)}</span>
            <span>${escapeHtml(symptom)}</span>
            <select class="field-edit-symptom-intensity" data-symptom="${escapeHtml(symptom)}" aria-label="Intensität ${escapeHtml(symptom)}">
              <option value="leicht" ${intensityMap[symptom] === "leicht" ? "selected" : ""}>leicht</option>
              <option value="mittel" ${!intensityMap[symptom] || intensityMap[symptom] === "mittel" ? "selected" : ""}>mittel</option>
              <option value="stark" ${intensityMap[symptom] === "stark" ? "selected" : ""}>stark</option>
            </select>
          </label>
        `).join("")}
      </div>
      <label class="field field-edit-value">
        <span>Weitere Symptome</span>
        <textarea id="fieldEditValue" rows="2" placeholder="Weitere Symptome, durch Komma getrennt">${escapeHtml(entry.custom_symptoms || "")}</textarea>
      </label>
      <div class="symptom-photo-box visible-symptom-photo-box field-edit-photo-box">
        <input id="fieldEditSymptomImageInput" type="file" accept="image/*" multiple />
        <button id="fieldEditSymptomImageButton" type="button" class="symptom-photo-button">📷 Foto hinzufügen</button>
        <div id="fieldEditSymptomImagePreview" class="symptom-image-preview"></div>
      </div>
    `;
    state.pendingFieldEditSymptomImages = normalizeSymptomImages(entry.symptom_images || []);
    renderPendingSymptomImages("fieldEditSymptomImagePreview", state.pendingFieldEditSymptomImages, "field");
    $("fieldEditSymptomImageButton").addEventListener("click", () => $("fieldEditSymptomImageInput").click());
    $("fieldEditSymptomImageInput").addEventListener("change", async event => {
      await handleSymptomImageFiles(event.target.files, "field");
      event.target.value = "";
    });
  } else if (field === "sleep") {
    const range = extractSleepRange(value);
    const cleanSleepText = stripGeneratedSleepDuration(value);
    $("fieldEditContent").innerHTML = `
      ${timeFieldHtml}
      <div class="field field-edit-value sleep-duration-field">
        <span>${escapeHtml(config.title)}</span>
        <div class="sleep-time-grid">
          <label><small>Von</small><input id="fieldEditSleepStart" class="sleep-time-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="HH:MM" value="${escapeHtml(range?.start || "")}" /></label>
          <label><small>Bis</small><input id="fieldEditSleepEnd" class="sleep-time-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="HH:MM" value="${escapeHtml(range?.end || "")}" /></label>
        </div>
        <div id="fieldEditSleepDurationPreview" class="sleep-duration-preview hidden"></div>
        <textarea id="fieldEditValue" rows="${config.rows}" placeholder="${escapeHtml(config.placeholder)}">${escapeHtml(cleanSleepText)}</textarea>
      </div>
    `;

    bindSleepTimeInputs($("fieldEditContent"));
    bindFieldEditSleepInputs();
    updateFieldEditSleepDurationPreview();
  } else if (config.input === "number") {
    const inputValue = field === "temperature" && value !== "" && value !== null && value !== undefined
      ? Number(value).toFixed(1)
      : value;
    $("fieldEditContent").innerHTML = `
      ${timeFieldHtml}
      <label class="field field-edit-value">
        <span>${escapeHtml(config.title)}</span>
        <input id="fieldEditValue" type="number" inputmode="decimal" step="${field === "temperature" ? "0.1" : "10"}" min="0" placeholder="${escapeHtml(config.placeholder)}" value="${escapeHtml(inputValue)}" />
      </label>
    `;
  } else {
    $("fieldEditContent").innerHTML = `
      ${timeFieldHtml}
      <label class="field field-edit-value">
        <span>${escapeHtml(config.title)}</span>
        <textarea id="fieldEditValue" rows="${config.rows}" placeholder="${escapeHtml(config.placeholder)}">${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  const fieldTime = $("fieldEditTime");
  if (fieldTime) {
    fieldTime.addEventListener("input", event => {
      const cursorAtEnd = event.target.selectionStart === event.target.value.length;
      event.target.value = formatTimeInputLive(event.target.value);
      if (cursorAtEnd) event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
    });
    fieldTime.addEventListener("blur", event => {
      event.target.value = normalizeTimeInput(event.target.value);
    });
  }

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
    state.pendingFieldEditSymptomImages = [];
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
    time: $("fieldEditTime") ? normalizeTimeInput($("fieldEditTime").value) : (entry.time || nowTime()),
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
    notes: entry.notes || "",
    symptom_images: normalizeSymptomImages(entry.symptom_images || [])
  };

  const rawValue = $("fieldEditValue").value.trim();

  if (field === "symptoms") {
    const selectedSymptoms = [...document.querySelectorAll("#fieldEditSymptomChips input:checked")].map(input => input.value);
    const intensity = {};
    selectedSymptoms.forEach(symptom => {
      const select = document.querySelector(`.field-edit-symptom-intensity[data-symptom="${CSS.escape(symptom)}"]`);
      if (select && select.value) intensity[symptom] = select.value;
    });
    payload.symptoms = selectedSymptoms;
    payload.symptom_intensity = intensity;
    payload.custom_symptoms = rawValue;
    payload.symptom_images = [...state.pendingFieldEditSymptomImages];
  } else if (field === "fluids_ml") {
    payload[field] = rawValue === "" ? null : Number(rawValue);
  } else if (field === "temperature") {
    payload[field] = rawValue === "" ? null : Number(String(rawValue).replace(",", "."));
  } else if (field === "sleep") {
    payload.sleep = buildSleepText(rawValue, $("fieldEditSleepStart")?.value || "", $("fieldEditSleepEnd")?.value || "");
  } else {
    payload[field] = rawValue;
  }

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
  if ($("sleepStart")) $("sleepStart").value = "";
  if ($("sleepEnd")) $("sleepEnd").value = "";
  updateSleepDurationPreview();
  $("diaperOrToilet").value = entry.diaper_or_toilet || "";
  $("notes").value = entry.notes || "";
  state.pendingSymptomImages = normalizeSymptomImages(entry.symptom_images || []);
  renderPendingSymptomImages("symptomImagePreview", state.pendingSymptomImages, "main");
  if ($("symptomImageInput")) $("symptomImageInput").value = "";
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


function dateInRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function analysisEntryTimestamp(entry) {
  return `${entry.date || ""} ${entry.time || ""}`;
}

function analysisValue(entry, category) {
  if (category === "temperature") {
    if (entry.temperature === null || entry.temperature === undefined || entry.temperature === "") return "";
    return `${Number(entry.temperature).toFixed(1)} °C`;
  }
  if (category === "fluids") {
    return entry.fluids_ml ? `${entry.fluids_ml} ml` : "";
  }
  if (category === "symptoms") {
    const intensityMap = entry.symptom_intensity || {};
    const parts = (entry.symptoms || []).map(symptom => {
      const level = intensityMap[symptom];
      return level ? `${symptom} (${level})` : symptom;
    });
    if (entry.custom_symptoms) {
      parts.push(...entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean));
    }
    return parts.join(", ");
  }
  if (category === "mood") return entry.mood || "";
  if (category === "medication") return entry.medication || "";
  if (category === "food") return entry.food || "";
  if (category === "sleep") return entry.sleep || "";
  if (category === "diaper_or_toilet") return entry.diaper_or_toilet || "";
  if (category === "notes") return entry.notes || "";
  if (category === "all") {
    const parts = [];
    if (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "") parts.push(`🌡️ ${Number(entry.temperature).toFixed(1)} °C`);
    if (entry.fluids_ml) parts.push(`💧 ${entry.fluids_ml} ml`);
    if (entry.mood) parts.push(`🙂 ${entry.mood}`);
    const symptoms = analysisValue(entry, "symptoms");
    if (symptoms) parts.push(`🤧 ${symptoms}`);
    if (entry.medication) parts.push(`💊 ${entry.medication}`);
    if (entry.food) parts.push(`🍽️ ${entry.food}`);
    if (entry.sleep) parts.push(`😴 ${entry.sleep}`);
    if (entry.diaper_or_toilet) parts.push(`🚽 ${entry.diaper_or_toilet}`);
    if (entry.notes) parts.push(`📝 ${entry.notes}`);
    return parts.join(" · ");
  }
  return "";
}

function analysisCategoryLabel(category) {
  const labels = {
    temperature: "Fieber / Temperatur",
    fluids: "Flüssigkeit",
    symptoms: "Symptome",
    mood: "Stimmung",
    medication: "Medikamente",
    food: "Essen",
    sleep: "Schlaf",
    diaper_or_toilet: "Windel / Toilette",
    notes: "Notizen",
    all: "Alle Einträge"
  };
  return labels[category] || category;
}

function renderTemperatureAnalysis(entries) {
  const values = entries
    .map(entry => Number(entry.temperature))
    .filter(value => !Number.isNaN(value));

  if (!values.length) {
    return `<div class="analysis-empty">Keine Temperaturwerte im gewählten Zeitraum.</div>`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const fever = values.filter(value => value >= 38.5).length;
  const highFever = values.filter(value => value >= 39).length;

  return `
    <div class="analysis-stat-grid">
      <div><span>Messungen</span><strong>${values.length}</strong></div>
      <div><span>Minimum</span><strong>${min.toFixed(1)} °C</strong></div>
      <div><span>Maximum</span><strong>${max.toFixed(1)} °C</strong></div>
      <div><span>Durchschnitt</span><strong>${avg.toFixed(1)} °C</strong></div>
      <div><span>ab 38,5 °C</span><strong>${fever}</strong></div>
      <div><span>ab 39,0 °C</span><strong>${highFever}</strong></div>
    </div>
  `;
}


function renderSymptomTrendAnalysis(entries) {
  const symptomMap = {};
  entries.forEach(entry => {
    const names = new Set();
    (entry.symptoms || []).forEach(symptom => {
      const s = String(symptom || "").trim();
      if (s) names.add(s);
    });
    if (entry.custom_symptoms) {
      entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean).forEach(s => names.add(s));
    }
    names.forEach(name => {
      if (!symptomMap[name]) symptomMap[name] = new Set();
      if (entry.date) symptomMap[name].add(entry.date);
    });
  });

  const rows = Object.entries(symptomMap)
    .map(([name, dates]) => ({ name, dates: [...dates].sort() }))
    .sort((a, b) => b.dates.length - a.dates.length || a.name.localeCompare(b.name));

  if (!rows.length) {
    return `<div class="analysis-empty">Keine Symptome im gewählten Zeitraum.</div>`;
  }

  return `
    <div class="symptom-trend-list">
      ${rows.map(row => `
        <div class="symptom-trend-row">
          <div class="symptom-trend-title">
            <span>${symptomIcon(row.name)}</span>
            <strong>${escapeHtml(row.name)}</strong>
            <em>${row.dates.length} Tag${row.dates.length === 1 ? "" : "e"}</em>
          </div>
          <div class="symptom-trend-dates">
            ${row.dates.map(date => `<span>${escapeHtml(formatDateShortGerman(date))}</span>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}


function allKnownSymptomsForExport() {
  const symptoms = new Set();
  (state.data.entries || []).forEach(entry => {
    (entry.symptoms || []).forEach(symptom => {
      const s = String(symptom || "").trim();
      if (s) symptoms.add(s);
    });
    if (entry.custom_symptoms) {
      entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean).forEach(s => symptoms.add(s));
    }
  });
  return [...symptoms].sort((a, b) => a.localeCompare(b));
}

function renderExportSymptomChips() {
  const container = $("exportSymptomChips") || $("analysisSymptomExportChips");
  if (!container) return;

  const symptoms = allKnownSymptomsForExport();
  if (!symptoms.length) {
    container.innerHTML = `<div class="analysis-export-empty">Noch keine Symptome vorhanden.</div>`;
    return;
  }

  container.innerHTML = `
    <label class="analysis-symptom-chip all">
      <input type="checkbox" value="__all__" checked />
      <span>Alle Symptome</span>
    </label>
    ${symptoms.map(symptom => `
      <label class="analysis-symptom-chip">
        <input type="checkbox" value="${escapeHtml(symptom)}" />
        <span>${symptomIcon(symptom)} ${escapeHtml(symptom)}</span>
      </label>
    `).join("")}
  `;

  const allInput = container.querySelector('input[value="__all__"]');
  const symptomInputs = [...container.querySelectorAll('input:not([value="__all__"])')];

  allInput.addEventListener("change", () => {
    if (allInput.checked) symptomInputs.forEach(input => input.checked = false);
  });

  symptomInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (symptomInputs.some(item => item.checked)) allInput.checked = false;
      if (!symptomInputs.some(item => item.checked)) allInput.checked = true;
    });
  });
}


function selectedExportCategories() {
  const container = $("exportCategoryChips");
  if (!container) return ["temperature", "fluids", "symptoms", "mood", "medication", "food", "sleep", "diaper_or_toilet", "notes"];
  const allChecked = container.querySelector('input[value="__all__"]')?.checked;
  const allCategories = ["temperature", "fluids", "symptoms", "mood", "medication", "food", "sleep", "diaper_or_toilet", "notes"];
  if (allChecked) return allCategories;
  const selected = [...container.querySelectorAll('input:not([value="__all__"]):checked')].map(input => input.value);
  return selected.length ? selected : allCategories;
}

function bindExportCategoryChips() {
  const container = $("exportCategoryChips");
  if (!container || container.dataset.bound === "1") return;
  container.dataset.bound = "1";
  const allInput = container.querySelector('input[value="__all__"]');
  const categoryInputs = [...container.querySelectorAll('input:not([value="__all__"])')];

  allInput.addEventListener("change", () => {
    if (allInput.checked) categoryInputs.forEach(input => input.checked = false);
    syncExportSymptomSection();
  });

  categoryInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (categoryInputs.some(item => item.checked)) allInput.checked = false;
      if (!categoryInputs.some(item => item.checked)) allInput.checked = true;
      syncExportSymptomSection();
    });
  });
}

function syncExportSymptomSection() {
  const box = $("exportSymptomChips")?.closest(".export-section");
  if (!box) return;
  const categories = selectedExportCategories();
  const active = categories.includes("symptoms");
  box.classList.toggle("muted-export-section", !active);
}

function exportCategoryHasValue(entry, category) {
  if (category === "temperature") return entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "";
  if (category === "fluids") return Boolean(entry.fluids_ml);
  if (category === "symptoms") return Boolean(analysisValue(entry, "symptoms"));
  if (category === "mood") return Boolean(entry.mood);
  if (category === "medication") return Boolean(entry.medication);
  if (category === "food") return Boolean(entry.food);
  if (category === "sleep") return Boolean(entry.sleep);
  if (category === "diaper_or_toilet") return Boolean(entry.diaper_or_toilet);
  if (category === "notes") return Boolean(entry.notes);
  return false;
}

function exportCategoryLine(entry, category) {
  if (category === "temperature" && exportCategoryHasValue(entry, category)) return `Temperatur: ${Number(entry.temperature).toFixed(1)} °C`;
  if (category === "fluids" && exportCategoryHasValue(entry, category)) return `Flüssigkeit: ${entry.fluids_ml} ml`;
  if (category === "symptoms" && exportCategoryHasValue(entry, category)) return `Symptome: ${analysisValue(entry, "symptoms")}`;
  if (category === "mood" && exportCategoryHasValue(entry, category)) return `Stimmung: ${entry.mood}`;
  if (category === "medication" && exportCategoryHasValue(entry, category)) return `Medikamente: ${entry.medication}`;
  if (category === "food" && exportCategoryHasValue(entry, category)) return `Essen: ${entry.food}`;
  if (category === "sleep" && exportCategoryHasValue(entry, category)) return `Schlaf: ${entry.sleep}`;
  if (category === "diaper_or_toilet" && exportCategoryHasValue(entry, category)) return `Windel/Toilette: ${entry.diaper_or_toilet}`;
  if (category === "notes" && exportCategoryHasValue(entry, category)) return `Notizen: ${entry.notes}`;
  return "";
}

function selectedExportSymptoms() {
  const container = $("exportSymptomChips") || $("analysisSymptomExportChips");
  if (!container) return [];
  const allChecked = container.querySelector('input[value="__all__"]')?.checked;
  if (allChecked) return [];
  return [...container.querySelectorAll('input:not([value="__all__"]):checked')].map(input => input.value);
}

function entryHasExportSymptom(entry, selected) {
  if (!selected.length) return true;
  const names = new Set();
  (entry.symptoms || []).forEach(symptom => {
    const s = String(symptom || "").trim();
    if (s) names.add(s);
  });
  if (entry.custom_symptoms) {
    entry.custom_symptoms.split(",").map(s => s.trim()).filter(Boolean).forEach(s => names.add(s));
  }
  return selected.some(symptom => names.has(symptom));
}


function buildFullExportText() {
  const from = $("exportFrom")?.value || "";
  const to = $("exportTo")?.value || "";
  const categories = selectedExportCategories();
  const selectedSymptoms = selectedExportSymptoms();

  const entries = (state.data.entries || [])
    .filter(entry => dateInRange(entry.date, from, to))
    .filter(entry => categories.some(category => exportCategoryHasValue(entry, category)))
    .filter(entry => {
      if (!categories.includes("symptoms") || !selectedSymptoms.length) return true;
      const hasOnlyNonSymptomCategory = categories.some(category => category !== "symptoms" && exportCategoryHasValue(entry, category));
      return hasOnlyNonSymptomCategory || entryHasExportSymptom(entry, selectedSymptoms);
    })
    .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

  const lines = [];
  lines.push("Gesundheitstracker Export");
  lines.push("========================");
  lines.push("");
  lines.push(`Exportart: Benutzerdefiniert`);
  lines.push(`Zeitraum: ${from ? formatDateShortGerman(from) : "offen"} bis ${to ? formatDateShortGerman(to) : "offen"}`);
  lines.push(`Kategorien: ${categories.map(analysisCategoryLabel).join(", ")}`);
  if (categories.includes("symptoms")) lines.push(`Symptomfilter: ${selectedSymptoms.length ? selectedSymptoms.join(", ") : "Alle Symptome"}`);
  lines.push(`Einträge: ${entries.length}`);
  lines.push("");

  if (!entries.length) {
    lines.push("Keine Einträge im gewählten Zeitraum gefunden.");
    return lines.join("\n");
  }

  categories.forEach(category => {
    const categoryEntries = entries
      .filter(entry => {
        if (!exportCategoryHasValue(entry, category)) return false;
        if (category === "symptoms" && selectedSymptoms.length) return entryHasExportSymptom(entry, selectedSymptoms);
        return true;
      })
      .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

    if (!categoryEntries.length) return;

    const categoryTitle = analysisCategoryLabel(category);
    lines.push(categoryTitle);
    lines.push("=".repeat(categoryTitle.length));

    const grouped = categoryEntries.reduce((acc, entry) => {
      const key = entry.date || "Ohne Datum";
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([date, dayEntries]) => {
      lines.push("");
      lines.push(formatDateShortGerman(date));
      lines.push("-".repeat(formatDateShortGerman(date).length));

      dayEntries
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .forEach(entry => {
          const line = exportCategoryLine(entry, category);
          if (line) lines.push(`${entry.time || "--:--"} Uhr · ${line}`);
        });
    });

    lines.push("");
  });

  return lines.join("\n");
}

function buildSymptomExportText() {
  const from = $("exportFrom")?.value || $("analysisFrom")?.value || "";
  const to = $("exportTo")?.value || $("analysisTo")?.value || "";
  const selected = selectedExportSymptoms();

  const entries = (state.data.entries || [])
    .filter(entry => dateInRange(entry.date, from, to))
    .filter(entry => analysisValue(entry, "symptoms"))
    .filter(entry => entryHasExportSymptom(entry, selected))
    .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

  const lines = [];
  lines.push("Gesundheitstracker Export");
  lines.push("========================");
  lines.push("");
  lines.push(`Zeitraum: ${from ? formatDateShortGerman(from) : "offen"} bis ${to ? formatDateShortGerman(to) : "offen"}`);
  lines.push(`Symptome: ${selected.length ? selected.join(", ") : "Alle Symptome"}`);
  lines.push(`Treffer: ${entries.length}`);
  lines.push("");

  if (!entries.length) {
    lines.push("Keine passenden Einträge gefunden.");
    return lines.join("\n");
  }

  const grouped = entries.reduce((acc, entry) => {
    const key = entry.date || "Ohne Datum";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([date, dayEntries]) => {
    lines.push(formatDateShortGerman(date));
    lines.push("-".repeat(formatDateShortGerman(date).length));

    dayEntries
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
      .forEach(entry => {
        const symptoms = analysisValue(entry, "symptoms");
        const extras = [];
        if (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== "") extras.push(`Temperatur: ${Number(entry.temperature).toFixed(1)} °C`);
        if (entry.medication) extras.push(`Medikamente: ${entry.medication}`);
        if (entry.fluids_ml) extras.push(`Flüssigkeit: ${entry.fluids_ml} ml`);
        if (entry.mood) extras.push(`Stimmung: ${entry.mood}`);
        if (entry.food) extras.push(`Essen: ${entry.food}`);
        if (entry.sleep) extras.push(`Schlaf: ${entry.sleep}`);
        if (entry.diaper_or_toilet) extras.push(`Windel/Toilette: ${entry.diaper_or_toilet}`);
        if (entry.notes) extras.push(`Notizen: ${entry.notes}`);

        lines.push(`${entry.time || "--:--"} Uhr · Symptome: ${symptoms}`);
        extras.forEach(extra => lines.push(`  - ${extra}`));
      });

    lines.push("");
  });

  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}


function categoryExportLabel(category) {
  return analysisCategoryLabel(category);
}

function buildPrintableExportHtml() {
  const from = $("exportFrom")?.value || "";
  const to = $("exportTo")?.value || "";
  const categories = selectedExportCategories();
  const selectedSymptoms = selectedExportSymptoms();

  const entries = (state.data.entries || [])
    .filter(entry => dateInRange(entry.date, from, to))
    .filter(entry => categories.some(category => exportCategoryHasValue(entry, category)))
    .filter(entry => {
      if (!categories.includes("symptoms") || !selectedSymptoms.length) return true;
      const hasOnlyNonSymptomCategory = categories.some(category => category !== "symptoms" && exportCategoryHasValue(entry, category));
      return hasOnlyNonSymptomCategory || entryHasExportSymptom(entry, selectedSymptoms);
    })
    .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

  const categoryText = categories.map(categoryExportLabel).join(", ");
  const symptomText = categories.includes("symptoms")
    ? (selectedSymptoms.length ? selectedSymptoms.join(", ") : "Alle Symptome")
    : "Nicht exportiert";

  const statRows = [];
  if (categories.includes("temperature")) {
    const values = entries.map(entry => Number(entry.temperature)).filter(value => !Number.isNaN(value));
    if (values.length) {
      statRows.push(["Temperaturmessungen", String(values.length)]);
      statRows.push(["Höchste Temperatur", `${Math.max(...values).toFixed(1)} °C`]);
      statRows.push(["Durchschnitt Temperatur", `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)} °C`]);
    }
  }
  if (categories.includes("fluids")) {
    const fluidSum = entries.reduce((sum, entry) => sum + (Number(entry.fluids_ml) || 0), 0);
    if (fluidSum) statRows.push(["Flüssigkeit gesamt", `${fluidSum} ml`]);
  }
  if (categories.includes("symptoms")) {
    const symptomDays = new Set();
    entries.forEach(entry => {
      if (analysisValue(entry, "symptoms")) symptomDays.add(entry.date);
    });
    if (symptomDays.size) statRows.push(["Tage mit Symptomen", String(symptomDays.size)]);
  }

  const categorySections = categories.map(category => {
    const categoryEntries = entries
      .filter(entry => {
        if (!exportCategoryHasValue(entry, category)) return false;
        if (category === "symptoms" && selectedSymptoms.length) return entryHasExportSymptom(entry, selectedSymptoms);
        return true;
      })
      .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

    if (!categoryEntries.length) return "";

    const groupedByDate = categoryEntries.reduce((acc, entry) => {
      const key = entry.date || "Ohne Datum";
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});

    return `
      <section class="print-category-section">
        <h2>${escapeHtml(categoryExportLabel(category))}</h2>
        ${Object.entries(groupedByDate).map(([date, dayEntries]) => `
          <div class="print-category-day">
            <h3>${escapeHtml(formatDateShortGerman(date))}</h3>
            <div class="print-category-items">
              ${[...dayEntries].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map(entry => {
                const line = exportCategoryLine(entry, category);
                if (!line) return "";
                return `
                  <div class="print-category-item">
                    <span>${escapeHtml(entry.time || "--:--")}</span>
                    <p>${escapeHtml(line)}</p>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }).filter(Boolean).join("");

  return `
    <header class="print-report-header">
      <div>
        <h1>Gesundheitstracker Bericht</h1>
        <p>${escapeHtml(formatDateShortGerman(from) || "offen")} bis ${escapeHtml(formatDateShortGerman(to) || "offen")}</p>
      </div>
      <div class="print-report-meta">
        <span>Erstellt am ${escapeHtml(new Date().toLocaleDateString("de-DE"))}</span>
      </div>
    </header>

    <section class="print-report-filter">
      <div><strong>Kategorien</strong><span>${escapeHtml(categoryText)}</span></div>
      <div><strong>Symptomfilter</strong><span>${escapeHtml(symptomText)}</span></div>
      <div><strong>Einträge</strong><span>${entries.length}</span></div>
    </section>

    ${statRows.length ? `
      <section class="print-report-stats">
        ${statRows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </section>
    ` : ""}

    ${categorySections || `
      <section class="print-report-empty">
        <strong>Keine passenden Einträge gefunden.</strong>
      </section>
    `}
  `;
}


function standaloneReportPageCss() {
  return `
    :root {
      color-scheme: light;
      --text: #17202a;
      --muted: #5c6672;
      --line: #dfe4eb;
      --soft: #f7f9fb;
      --head: #e8eef5;
      --accent: #53677f;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: #eef2f6;
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      line-height: 1.35;
    }

    .report-shell {
      max-width: 920px;
      margin: 0 auto;
      padding: 18px;
    }

    .report-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 8px;
      justify-content: space-between;
      align-items: center;
      margin: -18px -18px 16px -18px;
      padding: 10px 14px;
      background: rgba(238, 242, 246, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #d7dde6;
    }

    .report-toolbar strong {
      font-size: 0.95rem;
    }

    .report-toolbar button {
      appearance: none;
      border: 0;
      border-radius: 10px;
      background: #53677f;
      color: white;
      font-weight: 850;
      padding: 9px 12px;
      min-height: 38px;
    }

    .report-paper {
      background: white;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 18px 46px rgba(23, 32, 42, 0.14);
      border: 1px solid rgba(23, 32, 42, 0.08);
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
      border-bottom: 2px solid #d7dde6;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }

    h1 {
      margin: 0 0 5px 0;
      color: var(--text);
      font-size: 1.65rem;
      line-height: 1.12;
    }

    .report-header p,
    .report-meta {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .filter-grid,
    .stats-grid {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr;
      gap: 9px;
      margin-bottom: 14px;
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .filter-grid > div,
    .stats-grid > div {
      border: 1px solid var(--line);
      background: var(--soft);
      border-radius: 11px;
      padding: 10px;
      display: grid;
      gap: 4px;
    }

    .filter-grid strong,
    .stats-grid span {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .filter-grid span,
    .stats-grid strong {
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 850;
    }

    .category-section {
      margin-top: 20px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .category-section h2 {
      margin: 0 0 10px 0;
      padding: 8px 10px;
      border-radius: 9px;
      background: var(--head);
      color: var(--text);
      font-size: 1.04rem;
      line-height: 1.2;
    }

    .category-day {
      margin: 0 0 13px 0;
    }

    .category-day h3 {
      margin: 0 0 6px 0;
      color: #4d5967;
      font-size: 0.9rem;
      font-weight: 900;
    }

    .category-items {
      display: grid;
      gap: 5px;
    }

    .category-item {
      display: grid;
      grid-template-columns: 62px minmax(0, 1fr);
      gap: 10px;
      padding: 7px 0;
      border-bottom: 1px solid #e3e7ed;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .category-item time {
      color: var(--muted);
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      font-size: 0.84rem;
    }

    .category-item p {
      margin: 0;
      color: var(--text);
      font-size: 0.88rem;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .empty {
      padding: 20px;
      text-align: center;
      border: 1px dashed #c9d1dc;
      border-radius: 12px;
      color: var(--muted);
      font-weight: 850;
    }

    .hint {
      margin-top: 14px;
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.4;
    }

    @media (max-width: 640px) {
      .report-shell { padding: 10px; }
      .report-toolbar { margin: -10px -10px 10px -10px; }
      .report-paper { padding: 18px; border-radius: 12px; }
      .report-header { display: grid; }
      .filter-grid, .stats-grid { grid-template-columns: 1fr; }
      .category-item { grid-template-columns: 54px minmax(0, 1fr); }
      h1 { font-size: 1.35rem; }
    }

    @media print {
      body { background: white; }
      .report-shell { max-width: none; padding: 0; }
      .report-toolbar { display: none !important; }
      .report-paper {
        box-shadow: none;
        border: 0;
        border-radius: 0;
        padding: 0;
      }
      .hint { display: none; }
      @page { margin: 14mm; }
    }
  `;
}

function buildStandaloneReportPageHtml() {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gesundheitstracker Bericht</title>
  <style>${standaloneReportPageCss()}</style>
</head>
<body>
  <main class="report-shell">
    <div class="report-toolbar">
      <strong>Gesundheitstracker Bericht</strong>
      <button type="button" onclick="window.print()">Drucken / PDF</button>
    </div>
    <article class="report-paper">
      ${buildPrintableExportHtml()
        .replaceAll("print-report-header", "report-header")
        .replaceAll("print-report-meta", "report-meta")
        .replaceAll("print-report-filter", "filter-grid")
        .replaceAll("print-report-stats", "stats-grid")
        .replaceAll("print-category-section", "category-section")
        .replaceAll("print-category-day", "category-day")
        .replaceAll("print-category-items", "category-items")
        .replaceAll("print-category-item", "category-item")
        .replaceAll("print-report-empty", "empty")}
      <p class="hint">Tipp auf dem iPhone: Diese Seite in Safari öffnen und dann Teilen → Drucken → als PDF sichern.</p>
    </article>
  </main>
</body>
</html>`;
}

function openStandaloneReportPage() {
  const reportHtml = buildStandaloneReportPageHtml();
  const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  if (!win) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `gesundheitstracker-bericht-${$("exportFrom")?.value || "offen"}-bis-${$("exportTo")?.value || "offen"}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Bericht als HTML geöffnet");
  } else {
    showToast("Bericht-Seite geöffnet");
  }

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function openPrintableExport() {
  const content = $("printExportContent");
  if (!content) return;
  content.innerHTML = buildPrintableExportHtml();
  if ($("reportCopyBox")) $("reportCopyBox").classList.add("hidden");
  if ($("reportCopyText")) $("reportCopyText").value = "";
  openView("printExportView");
}

function plainTextFromReport() {
  const from = $("exportFrom")?.value || "offen";
  const to = $("exportTo")?.value || "offen";
  return buildFullExportText() || ($("printExportContent")?.innerText || "");
}

function showSelectableReportText() {
  const box = $("reportCopyBox");
  const textarea = $("reportCopyText");
  if (!box || !textarea) return;

  textarea.value = plainTextFromReport();
  box.classList.remove("hidden");

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
  });

  showToast("Text ist markiert");
}

function exportAnalysisSymptoms() {
  const from = $("exportFrom")?.value || "offen";
  const to = $("exportTo")?.value || "offen";
  const text = buildFullExportText();
  downloadTextFile(`gesundheitstracker-export-${from}-bis-${to}.txt`, text);
  showToast("Export erstellt");
}

function renderAnalysis() {
  const from = $("analysisFrom")?.value || "";
  const to = $("analysisTo")?.value || "";
  const category = $("analysisCategory")?.value || "temperature";
  const entries = (state.data.entries || [])
    .filter(entry => dateInRange(entry.date, from, to))
    .filter(entry => analysisValue(entry, category))
    .sort((a, b) => analysisEntryTimestamp(a).localeCompare(analysisEntryTimestamp(b)));

  const summary = $("analysisSummary");
  const results = $("analysisResults");
  if (!summary || !results) return;

  if (category === "temperature") {
    summary.innerHTML = renderTemperatureAnalysis(entries);
  } else if (category === "symptoms") {
    summary.innerHTML = renderSymptomTrendAnalysis(entries);
  } else {
    summary.innerHTML = `
      <div class="analysis-simple-summary">
        <span>${escapeHtml(analysisCategoryLabel(category))}</span>
        <strong>${entries.length} Treffer</strong>
      </div>
    `;
  }

  if (!entries.length) {
    results.innerHTML = `<div class="analysis-empty">Keine passenden Einträge gefunden.</div>`;
    return;
  }

  const grouped = entries.reduce((acc, entry) => {
    const key = entry.date || "Ohne Datum";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  results.innerHTML = Object.entries(grouped).map(([date, dayEntries]) => {
    const sortedDayEntries = [...dayEntries].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    return `
      <section class="analysis-day-group">
        <div class="analysis-day-head">
          <strong>${escapeHtml(formatDateShortGerman(date))}</strong>
          <span>${sortedDayEntries.length} Treffer</span>
        </div>
        <div class="analysis-day-items">
          ${sortedDayEntries.map(entry => {
            const value = analysisValue(entry, category);
            const tempClass = category === "temperature" ? feverClass(entry.temperature) : "";
            return `
              <div class="analysis-result-row ${tempClass}">
                <div class="analysis-result-time">
                  <span>${escapeHtml(entry.time || "--:--")} Uhr</span>
                </div>
                <p>${escapeHtml(value)}</p>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");
}



function closeTopMenu() {
  const menu = $("topMenuDropdown");
  if (!menu) return;
  menu.classList.add("hidden");
  menu.setAttribute("aria-hidden", "true");
}

function toggleTopMenu() {
  const menu = $("topMenuDropdown");
  if (!menu) return;
  const willOpen = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !willOpen);
  menu.setAttribute("aria-hidden", willOpen ? "false" : "true");
}

function syncMenuDarkModeButton() {
  const icon = $("menuDarkModeIcon");
  const text = $("menuDarkModeText");
  if (icon) icon.textContent = state.darkMode ? "☀️" : "🌙";
  if (text) text.textContent = state.darkMode ? "Light Mode" : "Dark Mode";
}

function openExportView() {
  const todayValue = today();
  const from = $("exportFrom");
  const to = $("exportTo");

  if (from && !from.value) {
    const d = new Date(`${todayValue}T12:00:00`);
    d.setDate(d.getDate() - 14);
    from.value = d.toISOString().slice(0, 10);
  }
  if (to && !to.value) to.value = todayValue;

  bindExportCategoryChips();
  renderExportSymptomChips();
  syncExportSymptomSection();
  openView("exportView");
}

function openAnalysisView() {
  const todayValue = today();
  const from = $("analysisFrom");
  const to = $("analysisTo");

  if (from && !from.value) {
    const d = new Date(`${todayValue}T12:00:00`);
    d.setDate(d.getDate() - 14);
    from.value = d.toISOString().slice(0, 10);
  }
  if (to && !to.value) to.value = todayValue;

  renderAnalysis();
  openView("analysisView");
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
  $("closeImagePreview").addEventListener("click", closeImagePreviewPopup);
  $("imagePreviewBackdrop").addEventListener("click", closeImagePreviewPopup);
  $("imagePreviewPrev").addEventListener("click", () => setImagePreviewIndex(state.imagePreviewIndex - 1));
  $("imagePreviewNext").addEventListener("click", () => setImagePreviewIndex(state.imagePreviewIndex + 1));
  $("shareImagePreview").addEventListener("click", shareCurrentImagePreview);
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
    state.pendingQuickSymptomImages = [];
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
  $("symptomImageButton").addEventListener("click", () => $("symptomImageInput").click());
  $("symptomImageInput").addEventListener("change", async event => {
    await handleSymptomImageFiles(event.target.files, "main");
    event.target.value = "";
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

  document.querySelectorAll("#moodOptions .mood-option").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleMood(btn.dataset.mood);
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

  if ($("themeSelect")) {
    $("themeSelect").addEventListener("change", (event) => {
      applyTheme(event.target.value);
      showToast("Theme geändert");
    });
  }

  if ($("darkModeToggle")) {
    $("darkModeToggle").addEventListener("change", (event) => {
      applyDarkMode(event.target.checked);
      showToast(event.target.checked ? "Dark Mode aktiviert" : "Dark Mode deaktiviert");
    });
  }

  $("analysisFrom").addEventListener("change", renderAnalysis);
  $("analysisTo").addEventListener("change", renderAnalysis);
  $("analysisCategory").addEventListener("change", renderAnalysis);
  if ($("analysisExportButton")) $("analysisExportButton").addEventListener("click", exportAnalysisSymptoms);
  $("exportCreateButton").addEventListener("click", exportAnalysisSymptoms);
  $("exportPrintButton").addEventListener("click", openPrintableExport);
  $("openReportPageButton").addEventListener("click", openStandaloneReportPage);
  $("selectReportButton").addEventListener("click", showSelectableReportText);
  $("closePrintExportButton").addEventListener("click", closeViews);

  $("importFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Import überschreibt die aktuellen Daten. Fortfahren?")) {
      event.target.value = "";
      return;
    }

    if (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip") {
      const headers = {};
      if (state.pin) headers["x-kindgesund-pin"] = state.pin;
      const res = await fetch("./api/import", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/zip"
        },
        body: await file.arrayBuffer()
      });

      if (!res.ok) {
        let message = `Fehler ${res.status}`;
        try {
          const body = await res.json();
          message = body.detail || message;
        } catch {}
        throw new Error(message);
      }
    } else {
      const data = JSON.parse(await file.text());
      await api("./api/import", { method: "POST", body: JSON.stringify(data) });
    }

    await loadState();
    showToast("Import abgeschlossen");
    event.target.value = "";
    closeViews();
  });

  if ($("searchButton")) $("searchButton").addEventListener("click", openAnalysisView);
  if ($("exportMenuButton")) $("exportMenuButton").addEventListener("click", openExportView);
  $("profileButton").addEventListener("click", () => openView("profileView"));
  if ($("topDarkModeButton")) {
    $("topDarkModeButton").addEventListener("click", () => {
      applyDarkMode(!state.darkMode);
      showToast(state.darkMode ? "Dark Mode aktiviert" : "Dark Mode deaktiviert");
    });
  }

  if ($("backupButton")) $("backupButton").addEventListener("click", () => openView("backupView"));
  $("moreMenuButton").addEventListener("click", toggleTopMenu);
  $("menuSearchButton").addEventListener("click", () => {
    closeTopMenu();
    openAnalysisView();
  });
  $("menuExportButton").addEventListener("click", () => {
    closeTopMenu();
    openExportView();
  });
  $("menuDarkModeButton").addEventListener("click", () => {
    applyDarkMode(!state.darkMode);
    closeTopMenu();
    showToast(state.darkMode ? "Dark Mode aktiviert" : "Dark Mode deaktiviert");
  });
  $("menuThemeButton").addEventListener("click", () => {
    closeTopMenu();
    if ($("themePopupSelect")) $("themePopupSelect").value = state.theme;
    openView("themeView");
  });
  $("themePopupSelect").addEventListener("change", (event) => {
    applyTheme(event.target.value);
    showToast("Theme geändert");
  });

  $("menuBackupButton").addEventListener("click", () => {
    closeTopMenu();
    openView("backupView");
  });
  document.addEventListener("click", event => {
    if (!$("topMenuDropdown") || $("topMenuDropdown").classList.contains("hidden")) return;
    if (event.target.closest(".top-menu-wrap")) return;
    closeTopMenu();
  });



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
