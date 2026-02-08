// ✅ Paste your Apps Script Web App URL here:
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzx9EKoA0QnIy9F8vHaV3xRqI71bcUf8zTiQ5fXYM2Y8SHFhOdsVADQJOIRfkKFuQID/exec";

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

function showSection(type) {
  const egg = $("secEgg");
  const maint = $("secMaint");
  const wash = $("secWash");
  const pack = $("secPack");

  hide(egg);
  hide(maint);
  hide(wash);
  hide(pack);

  // Travel field only meaningful for Egg Collection
  const travelWrap = $("travelWrap");
  const travelHours = $("travelHours");

  if (type === "Egg Collection") {
    show(egg);
    if (travelWrap) show(travelWrap);

    // Fixed default for travel
    if (travelHours) {
      if (travelHours.value === "" || Number(travelHours.value) === 0) {
        travelHours.value = "2";
      }
      travelHours.readOnly = true; // lock it
    }
  } else {
    if (travelWrap) hide(travelWrap);
    if (travelHours) {
      travelHours.readOnly = false;
      travelHours.value = "";
    }
  }

  if (type === "Maintenance") show(maint);
  if (type === "Washing") show(wash);
  if (type === "Packing") show(pack);
}

function recalc() {
  const type = sval("workType");

  const travel = nval("travelHours");
  const work = nval("workHours");
  const total =
    Number.isFinite(travel) && Number.isFinite(work) ? travel + work : "";

  const totalOut = $("totalHoursOut");
  if (totalOut) totalOut.textContent = fmt(total);

  // Egg Collection calculations
  if (type === "Egg Collection") {
    const eggs = nval("eggsCollected");
    const numWorkers = nval("numWorkers");

    const avgHr =
      Number.isFinite(eggs) && Number.isFinite(work) && work > 0
        ? eggs / work
        : "";
    const avgPerson =
      Number.isFinite(eggs) && Number.isFinite(numWorkers) && numWorkers > 0
        ? eggs / numWorkers
        : "";

    const outHr = $("avgEggsHourOut");
    const outPerson = $("avgEggsPersonOut");
    if (outHr) outHr.textContent = fmt(avgHr);
    if (outPerson) outPerson.textContent = fmt(avgPerson);
  }

  // Washing calculations
  if (type === "Washing") {
    const dirty = nval("dirtyEggs");
    const washed = nval("washedEggs");

    const broken =
      Number.isFinite(dirty) && Number.isFinite(washed)
        ? Math.max(0, dirty - washed)
        : "";
    const rate =
      Number.isFinite(washed) && Number.isFinite(work) && work > 0
        ? washed / work
        : "";

    const outBroken = $("brokenEggsOut");
    const outRate = $("washRateOut");
    if (outBroken) outBroken.textContent = fmt(broken);
    if (outRate) outRate.textContent = fmt(rate);
  }

  // Packing calculations
  if (type === "Packing") {
    const packed = nval("eggsPacked");
    const rate =
      Number.isFinite(packed) && Number.isFinite(work) && work > 0
        ? packed / work
        : "";
    const outPack = $("packRateOut");
    if (outPack) outPack.textContent = fmt(rate);
  }
}

// --- Signature pad ---
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

function resetFormKeepDate() {
  if ($("numWorkers")) $("numWorkers").value = "";
  if ($("workerNames")) $("workerNames").value = "";
  if ($("workHours")) $("workHours").value = "";

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

async function submitDiary() {
  const status = $("status");
  const btn = $("submitBtn");

  if (status) status.textContent = "";

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_WEB_APP_URL")) {
    if (status) status.textContent = "❌ Please set WEB_APP_URL in diary.js";
    return;
  }

  const date = sval("date");
  const workType = sval("workType");

  if (!date) {
    if (status) status.textContent = "❌ Please select a date.";
    return;
  }
  if (!sval("submittedBy")) {
    if (status) status.textContent = "❌ Please fill 'Submitted By'.";
    return;
  }

  // Enforce travel time for egg collection
  const travelHoursFinal = workType === "Egg Collection" ? 2 : "";

  const payload = {
    date,
    workType,
    numWorkers: nval("numWorkers"),
    workerNames: sval("workerNames"),
    travelHours: travelHoursFinal,
    workHours: nval("workHours"),

    // Egg collection
    eggsCollected: nval("eggsCollected"),

    // Maintenance
    maintenanceType: sval("maintenanceType"),
    maintenanceDetails: sval("maintenanceDetails"),

    // Washing
    dirtyEggs: nval("dirtyEggs"),
    washedEggs: nval("washedEggs"),

    // Packing
    eggsToPack: nval("eggsToPack"),
    eggsPacked: nval("eggsPacked"),
    brokenPacked: nval("brokenPacked"),

    // Common
    remarks: sval("remarks"),
    submittedBy: sval("submittedBy"),
    signatureDataURL: canvas ? canvas.toDataURL("image/png") : "",
  };

  if (btn) btn.disabled = true;
  if (status) status.textContent = "Submitting…";

try {
  const body = new URLSearchParams();
  body.append("data", JSON.stringify(payload));

  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    body: body
  });

  status.textContent = "✅ Submitted! (Saved to sheet)";
  // reset form...
} catch (e) {
  status.textContent = "❌ Network error: " + String(e);
}

}

// Init
window.addEventListener("load", () => {
  // Set date + header pill
  const t = todayISO();
  if ($("date")) $("date").value = t;
  if ($("todayPill")) $("todayPill").textContent = `Today: ${t}`;

  // Signature canvas must be set after DOM loads
  canvas = $("sigCanvas");
  if (canvas) {
    ctx = canvas.getContext("2d");

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });
  } else {
    console.warn("sigCanvas not found. Signature will be disabled.");
  }

  // Buttons
  const clearBtn = $("clearSig");
  if (clearBtn) clearBtn.addEventListener("click", clearSignature);

  const submitBtn = $("submitBtn");
  if (submitBtn) submitBtn.addEventListener("click", submitDiary);

  // Section switch
  const wt = $("workType");
  if (wt) {
    showSection(wt.value);
    wt.addEventListener("change", (e) => {
      showSection(e.target.value);
      recalc();
    });
  }

  // Recalc on inputs
  [
    "numWorkers",
    "workerNames",
    "travelHours",
    "workHours",
    "eggsCollected",
    "dirtyEggs",
    "washedEggs",
    "eggsPacked",
  ].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", recalc);
  });

  recalc();
});
