// Hilltops Daily Staff Diary - diary.js (clean version)

// ✅ Paste your Apps Script Web App URL here:
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzx9EKoA0QnIy9F8vHaV3xRqI71bcUf8zTiQ5fXYM2Y8SHFhOdsVADQJOIRfkKFuQID/exec";

const $ = (id) => document.getElementById(id);

// ---------- Helpers ----------
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmt(n) {
  if (n === "" || n === null || n === undefined) return "—";
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function nval(id) {
  const el = $(id);
  if (!el) return "";
  const v = el.value;
  if (v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function sval(id) {
  const el = $(id);
  return el ? String(el.value || "").trim() : "";
}

function hide(el) {
  if (el) el.classList.add("hidden");
}
function show(el) {
  if (el) el.classList.remove("hidden");
}

function parseTimeToMinutes(t) {
  // "08:30" -> 510
  if (!t || !t.includes(":")) return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

// Auto-calculate work hours from Start/End minus Break and (optional) Travel
function calcWorkHours() {
  const type = sval("workType");

  const start = parseTimeToMinutes(sval("startTime"));
  const end = parseTimeToMinutes(sval("endTime"));
  const breakMins = Number(nval("breakMins") || 0);

  if (start === null || end === null) return "";

  // Handle overnight (if end earlier than start)
  let totalMins = end - start;
  if (totalMins < 0) totalMins += 24 * 60;

  const travelHours = type === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;
  const travelMins = travelHours * 60;

  let workMins = totalMins - breakMins - travelMins;
  if (workMins < 0) workMins = 0;

  return workMins / 60; // hours
}

// ---------- UI Sections ----------
function showSection(type) {
  const egg = $("secEgg");
  const maint = $("secMaint");
  const wash = $("secWash");
  const pack = $("secPack");

  hide(egg);
  hide(maint);
  hide(wash);
  hide(pack);

  if (type === "Egg Collection") show(egg);
  if (type === "Maintenance") show(maint);
  if (type === "Washing") show(wash);
  if (type === "Packing") show(pack);

  // Travel shown only for egg collection
  const travelWrap = $("travelWrap");
  if (type === "Egg Collection") {
    show(travelWrap);
    // Default 2 hours (editable)
    const th = $("travelHours");
    if (th && (th.value === "" || Number(th.value) === 0)) th.value = "2";
  } else {
    hide(travelWrap);
  }

  recalc();
}

function recalc() {
  const type = sval("workType");

  // Compute work hours from time fields
  const computedWork = calcWorkHours();
  if ($("workHours")) $("workHours").value = computedWork === "" ? "" : computedWork.toFixed(2);

  const work = computedWork === "" ? "" : computedWork;

  // Total hours shown (shift total = end-start minus break, but still useful to show)
  // Here we'll show: work + travel (only for egg collection)
  const travel = type === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;
  const total = Number.isFinite(work) ? (work + travel) : "";

  if ($("totalHoursOut")) $("totalHoursOut").textContent = fmt(total);

  // Egg Collection calculations (avg per collection hour uses work only)
  if (type === "Egg Collection") {
    const eggs = Number(nval("eggsCollected") || 0);
    const numWorkers = Number(nval("numWorkers") || 0);

    const avgHr = work && work > 0 ? eggs / work : "";
    const avgPerson = numWorkers > 0 ? eggs / numWorkers : "";

    if ($("avgEggsHourOut")) $("avgEggsHourOut").textContent = fmt(avgHr);
    if ($("avgEggsPersonOut")) $("avgEggsPersonOut").textContent = fmt(avgPerson);
  }

  // Washing calculations
  if (type === "Washing") {
    const dirty = nval("dirtyEggs");
    const washed = nval("washedEggs");

    const broken =
      Number.isFinite(dirty) && Number.isFinite(washed) ? Math.max(0, dirty - washed) : "";
    const rate =
      Number.isFinite(washed) && Number.isFinite(work) && work > 0 ? washed / work : "";

    if ($("brokenEggsOut")) $("brokenEggsOut").textContent = fmt(broken);
    if ($("washRateOut")) $("washRateOut").textContent = fmt(rate);
  }

  // Packing rate calculation
  if (type === "Packing") {
    const packed = nval("eggsPacked");
    const rate =
      Number.isFinite(packed) && Number.isFinite(work) && work > 0 ? packed / work : "";
    if ($("packRateOut")) $("packRateOut").textContent = fmt(rate);
  }
}

// ---------- Signature Pad ----------
let canvas, ctx;
let drawing = false;
let last = null;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches && e.touches[0];
  const clientX = touch ? touch.clientX : e.clientX;
  const clientY = touch ? touch.clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

function startDraw(e) {
  drawing = true;
  last = getPos(e);
  e.preventDefault();
}

function moveDraw(e) {
  if (!drawing) return;
  const p = getPos(e);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  e.preventDefault();
}

function endDraw(e) {
  drawing = false;
  last = null;
  e.preventDefault();
}

function clearSignature() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---------- Form Reset ----------
function resetFormKeepDateAndSubmitter() {
  if ($("numWorkers")) $("numWorkers").value = "";
  if ($("workerNames")) $("workerNames").value = "";

  if ($("startTime")) $("startTime").value = "";
  if ($("endTime")) $("endTime").value = "";
  if ($("breakMins")) $("breakMins").value = "0";
  if ($("workHours")) $("workHours").value = "";

  // Keep travel default for egg collection (editable)
  if (sval("workType") === "Egg Collection") {
    if ($("travelHours")) $("travelHours").value = $("travelHours").value || "2";
  }

  if ($("eggsCollected")) $("eggsCollected").value = "";
  if ($("maintenanceType")) $("maintenanceType").value = "";
  if ($("maintenanceDetails")) $("maintenanceDetails").value = "";
  if ($("dirtyEggs")) $("dirtyEggs").value = "";
  if ($("washedEggs")) $("washedEggs").value = "";
  if ($("eggsToPack")) $("eggsToPack").value = "";
  if ($("eggsPacked")) $("eggsPacked").value = "";
  if ($("brokenPacked")) $("brokenPacked").value = "";
  if ($("remarks")) $("remarks").value = "";

  clearSignature();
  recalc();
}

// ---------- Submit ----------
async function submitDiary() {
  const status = $("status");
  const btn = $("submitBtn");
  if (status) status.textContent = "";

  if (!WEB_APP_URL) {
    if (status) status.textContent = "❌ Web App URL missing in diary.js";
    return;
  }

  const date = sval("date");
  const workType = sval("workType");
  const submittedBy = sval("submittedBy");

  if (!date) {
    if (status) status.textContent = "❌ Please select a date.";
    return;
  }
  if (!submittedBy) {
    if (status) status.textContent = "❌ Please fill 'Submitted By'.";
    return;
  }

  // Recalc once more before sending
  recalc();

  const computedWork = Number(nval("workHours") || 0);
  const travelFinal = workType === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;

  const payload = {
    date,
    workType,
    numWorkers: nval("numWorkers"),
    workerNames: sval("workerNames"),

    startTime: sval("startTime"),
    endTime: sval("endTime"),
    breakMins: nval("breakMins"),
    travelHours: travelFinal,
    workHours: computedWork,
