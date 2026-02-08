// Hilltops Daily Staff Diary - diary.js (iPhone-safe FULL CLEAN VERSION)
// Break is NOT paid. Travel is paid (for Egg Collection only).
// Labour Hours (person-hours) = (Shift Hours - Break) × Number of Workers
// Work Time (hours) = (Shift - Break - Travel)  [productive time excluding travel]

"use strict";

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

// Shift hours (paid per person) = (End - Start - Break)
function calcPaidShiftHoursPerPerson() {
  const start = parseTimeToMinutes(sval("startTime"));
  const end = parseTimeToMinutes(sval("endTime"));
  const breakMins = Number(nval("breakMins") || 0);

  if (start === null || end === null) return "";

  let totalMins = end - start;
  if (totalMins < 0) totalMins += 24 * 60; // overnight

  let paidMins = totalMins - breakMins; // break NOT paid
  if (paidMins < 0) paidMins = 0;

  return paidMins / 60;
}

// Productive work hours (per person) = (Shift - Break - Travel(for egg collection))
function calcWorkHoursPerPerson() {
  const type = sval("workType");
  const start = parseTimeToMinutes(sval("startTime"));
  const end = parseTimeToMinutes(sval("endTime"));
  const breakMins = Number(nval("breakMins") || 0);

  if (start === null || end === null) return "";

  let totalMins = end - start;
  if (totalMins < 0) totalMins += 24 * 60; // overnight

  const travelHours = type === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;
  const travelMins = travelHours * 60;

  let workMins = totalMins - breakMins - travelMins;
  if (workMins < 0) workMins = 0;

  return workMins / 60;
}

// ---------- UI Sections ----------
function showSection(type) {
  hide($("secEgg"));
  hide($("secMaint"));
  hide($("secWash"));
  hide($("secPack"));

  if (type === "Egg Collection") show($("secEgg"));
  if (type === "Maintenance") show($("secMaint"));
  if (type === "Washing") show($("secWash"));
  if (type === "Packing") show($("secPack"));

  // Travel shown only for egg collection
  const travelWrap = $("travelWrap");
  if (type === "Egg Collection") {
    show(travelWrap);
    const th = $("travelHours");
    if (th && (th.value === "" || Number(th.value) === 0)) th.value = "2"; // default, editable
  } else {
    hide(travelWrap);
  }

  recalc();
}

function recalc() {
  const type = sval("workType");
  const workers = Number(nval("numWorkers") || 0);

  // Per-person hours
  const paidShiftPerPerson = calcPaidShiftHoursPerPerson(); // includes travel (paid), excludes break
  const workPerPerson = calcWorkHoursPerPerson(); // excludes break AND travel (egg collection)

  // Write Work Time field (productive, per person)
  const workHoursEl = $("workHours");
  if (workHoursEl) {
    workHoursEl.value = workPerPerson === "" ? "" : Number(workPerPerson).toFixed(2);
  }

  // Labour hours (person-hours) = paid shift per person × workers
  const labourHours =
    Number.isFinite(paidShiftPerPerson) && workers > 0 ? paidShiftPerPerson * workers : "";

  const labourEl = $("labourHours");
  if (labourEl) {
    labourEl.value = labourHours === "" ? "" : labourHours.toFixed(2);
  }

  // Total Hours box shows labour hours (person-hours)
  const totalOut = $("totalHoursOut");
  if (totalOut) {
    totalOut.textContent = fmt(labourHours);
  }

  // ---- Task-specific calculations ----

  // Egg Collection: averages use PRODUCTIVE work time (excluding travel)
  if (type === "Egg Collection") {
    const eggs = Number(nval("eggsCollected") || 0);
    const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;

    const avgHr = w > 0 ? eggs / w : "";
    const avgPerson = workers > 0 ? eggs / workers : "";

    const a1 = $("avgEggsHourOut");
    const a2 = $("avgEggsPersonOut");
    if (a1) a1.textContent = fmt(avgHr);
    if (a2) a2.textContent = fmt(avgPerson);
  }

  // Washing
  if (type === "Washing") {
    const dirty = nval("dirtyEggs");
    const washed = nval("washedEggs");
    const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;

    const broken =
      Number.isFinite(dirty) && Number.isFinite(washed) ? Math.max(0, dirty - washed) : "";
    const rate = Number.isFinite(washed) && w > 0 ? washed / w : "";

    const b1 = $("brokenEggsOut");
    const b2 = $("washRateOut");
    if (b1) b1.textContent = fmt(broken);
    if (b2) b2.textContent = fmt(rate);
  }

  // Packing
  if (type === "Packing") {
    const packed = nval("eggsPacked");
    const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;

    const rate = Number.isFinite(packed) && w > 0 ? packed / w : "";
    const p1 = $("packRateOut");
    if (p1) p1.textContent = fmt(rate);
  }
}

// ---------- Signature Pad (iPhone safe resize) ----------
let canvas, ctx;
let drawing = false;
let last = null;

function resizeCanvasToCSS() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Set internal canvas size to match displayed size (important for iPhone touch)
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches && e.touches[0];
  const clientX = touch ? touch.clientX : e.clientX;
  const clientY = touch ? touch.clientY : e.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
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
  if ($("labourHours")) $("labourHours").value = "";

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

  recalc();

  const workers = Number(nval("numWorkers") || 0);
  const travelFinal = workType === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;

  const paidShiftPerPerson = calcPaidShiftHoursPerPerson(); // shift - break
  const workPerPerson = calcWorkHoursPerPerson(); // shift - break - travel

  const labourHours =
    Number.isFinite(paidShiftPerPerson) && workers > 0 ? paidShiftPerPerson * workers : "";

  const payload = {
    date,
    workType,
    numWorkers: workers,
    workerNames: sval("workerNames"),

    startTime: sval("startTime"),
    endTime: sval("endTime"),
    breakMins: nval("breakMins"),

    travelHours: travelFinal,
    workHours: Number.isFinite(workPerPerson) ? Number(workPerPerson) : 0,
    labourHours: labourHours,

    eggsCollected: nval("eggsCollected"),

    maintenanceType: sval("maintenanceType"),
    maintenanceDetails: sval("maintenanceDetails"),

    dirtyEggs: nval("dirtyEggs"),
    washedEggs: nval("washedEggs"),

    eggsToPack: nval("eggsToPack"),
    eggsPacked: nval("eggsPacked"),
    brokenPacked: nval("brokenPacked"),

    remarks: sval("remarks"),
    submittedBy,

    signatureDataURL: canvas ? canvas.toDataURL("image/png") : "",
  };

  if (btn) btn.disabled = true;
  if (status) status.textContent = "Submitting…";

  try {
    const body = new URLSearchParams();
    body.append("data", JSON.stringify(payload));

    await fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", body });

    if (status) status.textContent = "✅ Submitted! (Saved to sheet)";
    resetFormKeepDateAndSubmitter();
  } catch (e) {
    if (status) status.textContent = "❌ Network error: " + String(e);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------- Init (more reliable on iPhone) ----------
document.addEventListener("DOMContentLoaded", () => {
  // Show any JS errors in the status area (helps iPhone debugging)
  window.addEventListener("error", (ev) => {
    const status = $("status");
    if (status) status.textContent = "❌ JS error: " + (ev.message || "Unknown");
  });

  const t = todayISO();
  if ($("date")) $("date").value = t;
  if ($("todayPill")) $("todayPill").textContent = `Today: ${t}`;

  canvas = $("sigCanvas");
  if (canvas) {
    resizeCanvasToCSS();

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });

    window.addEventListener("resize", () => {
      const old = canvas.toDataURL("image/png");
      resizeCanvasToCSS();
      // we don't restore old drawing to keep it simple; optional
    });
  }

  if ($("clearSig")) $("clearSig").addEventListener("click", clearSignature);
  if ($("submitBtn")) $("submitBtn").addEventListener("click", submitDiary);

  if ($("workType")) {
    showSection($("workType").value);
    $("workType").addEventListener("change", (e) => showSection(e.target.value));
  }

  // Recalc on relevant inputs (use BOTH input + change for iPhone)
  const ids = [
    "numWorkers",
    "workerNames",
    "startTime",
    "endTime",
    "breakMins",
    "travelHours",
    "eggsCollected",
    "dirtyEggs",
    "washedEggs",
    "eggsPacked",
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", recalc);
    el.addEventListener("change", recalc);
  });

  recalc();
});
