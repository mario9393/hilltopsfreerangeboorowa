// ✅ Paste your Apps Script Web App URL here:
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzx9EKoA0QnIy9F8vHaV3xRqI71bcUf8zTiQ5fXYM2Y8SHFhOdsVADQJOIRfkKFuQID/exec";

const $ = (id) => document.getElementById(id);

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
  const v = $(id).value;
  if (v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function showSection(type) {
  const egg = $("secEgg");
  const maint = $("secMaint");
  const wash = $("secWash");
  const pack = $("secPack");

  egg.classList.add("hidden");
  maint.classList.add("hidden");
  wash.classList.add("hidden");
  pack.classList.add("hidden");

  // Travel field only meaningful for Egg Collection
  const travelWrap = $("travelWrap");
  if (type === "Egg Collection") {
    egg.classList.remove("hidden");
    travelWrap.classList.remove("hidden");
    // Fixed default for travel
    if ($("travelHours").value === "" || Number($("travelHours").value) === 0) {
      $("travelHours").value = "2";
    }
    // You can lock it by uncommenting:
    $("travelHours").readOnly = true;
  } else {
    travelWrap.classList.add("hidden");
    $("travelHours").readOnly = false;
    $("travelHours").value = "";
  }

  if (type === "Maintenance") maint.classList.remove("hidden");
  if (type === "Washing") wash.classList.remove("hidden");
  if (type === "Packing") pack.classList.remove("hidden");
}

function recalc() {
  const type = $("workType").value;

  const travel = nval("travelHours");
  const work = nval("workHours");
  const total = (Number.isFinite(travel) && Number.isFinite(work)) ? (travel + work) : "";

  $("totalHoursOut").textContent = fmt(total);

  // Egg Collection calculations
  if (type === "Egg Collection") {
    const eggs = nval("eggsCollected");
    const numWorkers = nval("numWorkers");

    const avgHr = (Number.isFinite(eggs) && Number.isFinite(work) && work > 0) ? (eggs / work) : "";
    const avgPerson = (Number.isFinite(eggs) && Number.isFinite(numWorkers) && numWorkers > 0) ? (eggs / numWorkers) : "";

    $("avgEggsHourOut").textContent = fmt(avgHr);
    $("avgEggsPersonOut").textContent = fmt(avgPerson);
  }

  // Washing calculations
  if (type === "Washing") {
    const dirty = nval("dirtyEggs");
    const washed = nval("washedEggs");

    const broken = (Number.isFinite(dirty) && Number.isFinite(washed)) ? Math.max(0, dirty - washed) : "";
    const rate = (Number.isFinite(washed) && Number.isFinite(work) && work > 0) ? (washed / work) : "";

    $("brokenEggsOut").textContent = fmt(broken);
    $("washRateOut").textContent = fmt(rate);
  }

  // Packing calculations
  if (type === "Packing") {
    const packed = nval("eggsPacked");
    const rate = (Number.isFinite(packed) && Number.isFinite(work) && work > 0) ? (packed / work) : "";
    $("packRateOut").textContent = fmt(rate);
  }
}

// --- Signature pad (simple, no external libraries) ---
const canvas = $("sigCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let last = null;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches && e.touches[0];
  const clientX = touch ? touch.clientX : e.clientX;
  const clientY = touch ? touch.clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
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

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", moveDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

canvas.addEventListener("touchstart", startDraw, { passive:false });
canvas.addEventListener("touchmove", moveDraw, { passive:false });
canvas.addEventListener("touchend", endDraw, { passive:false });

$("clearSig").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

async function submitDiary() {
  const status = $("status");
  status.textContent = "";

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_WEB_APP_URL")) {
    status.textContent = "❌ Please set WEB_APP_URL in diary.js";
    return;
  }

  const date = $("date").value;
  const workType = $("workType").value;

  if (!date) { status.textContent = "❌ Please select a date."; return; }
  if (!$("submittedBy").value.trim()) { status.textContent = "❌ Please fill 'Submitted By'."; return; }

  // Build payload
  const payload = {
    date,
    workType,
    numWorkers: nval("numWorkers"),
    workerNames: $("workerNames").value.trim(),
    travelHours: workType === "Egg Collection" ? 2 : "", // enforce fixed travel time
    workHours: nval("workHours"),
    eggsCollected: nval("eggsCollected"),
    maintenanceType: $("maintenanceType") ? $("maintenanceType").value : "",
    maintenanceDetails: $("maintenanceDetails") ? $("maintenanceDetails").value.trim() : "",
    dirtyEggs: nval("dirtyEggs"),
    washedEggs: nval("washedEggs"),
    eggsToPack: nval("eggsToPack"),
    eggsPacked: nval("eggsPacked"),
    brokenPacked: nval("brokenPacked"),
    remarks: $("remarks").value.trim(),
    submittedBy: $("submittedBy").value.trim(),
    signatureDataURL: canvas.toDataURL("image/png")
  };

  $("submitBtn").disabled = true;
  status.textContent = "Submitting…";

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const out = await res.json();
    if (out.ok) {
      status.textContent = "✅ Saved to diary!";
      // Reset relevant fields (keep date)
      $("numWorkers").value = "";
      $("workerNames").value = "";
      $("workHours").value = "";
      $("eggsCollected").value = "";
      $("maintenanceType").value = "";
      $("maintenanceDetails").value = "";
      $("dirtyEggs").value = "";
      $("washedEggs").value = "";
      $("eggsToPack").value = "";
      $("eggsPacked").value = "";
      $("brokenPacked").value = "";
      $("remarks").value = "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      recalc();
    } else {
      status.textContent = "❌ Error: " + (out.error || "Unknown");
    }
  } catch (e) {
    status.textContent = "❌ Network error: " + String(e);
  } finally {
    $("submitBtn").disabled = false;
  }
}

// Init
window.addEventListener("load", () => {
  const t = todayISO();
  $("date").value = t;
  $("todayPill").textContent = `Today: ${t}`;

  showSection($("workType").value);
  recalc();

  $("workType").addEventListener("change", (e) => {
    showSection(e.target.value);
    recalc();
  });

  // Recalc on inputs
  [
    "numWorkers","workerNames","travelHours","workHours","eggsCollected",
    "dirtyEggs","washedEggs","eggsPacked"
  ].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("input", recalc);
  });

  $("submitBtn").addEventListener("click", submitDiary);
});
