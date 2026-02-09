/* diary.js — Hilltops Daily Staff Diary
   Works with your diary.html exactly (IDs match).
   Upload this file next to diary.html in the same GitHub Pages folder.
*/

(() => {
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
    if (v === "" || v === null || v === undefined) return "";
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

    const travelHours =
      type === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;
    const travelMins = travelHours * 60;

    let workMins = totalMins - breakMins - travelMins;
    if (workMins < 0) workMins = 0;

    return workMins / 60;
  }

  // ---------- Egg total (8 flocks) ----------
  const FLOCK_INPUT_IDS = [
    "eggsF43",
    "eggsF41",
    "eggsF36",
    "eggsF44",
    "eggsF24",
    "eggsF35",
    "eggsF45",
    "eggsF48",
  ];

  function calcTotalEggsFromFlocks() {
    let total = 0;
    for (const id of FLOCK_INPUT_IDS) {
      const v = Number(nval(id) || 0);
      if (Number.isFinite(v)) total += v;
    }
    if ($("eggsCollected")) $("eggsCollected").value = String(total);
    return total;
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
      const th = $("travelHours");
      if (th && (th.value === "" || Number(th.value) === 0)) th.value = "2";
    } else {
      hide(travelWrap);
    }

    recalc();
  }

  function recalc() {
    const type = sval("workType");
    const workers = Number(nval("numWorkers") || 0);

    const totalEggs = calcTotalEggsFromFlocks();

    const paidShiftPerPerson = calcPaidShiftHoursPerPerson(); // shift - break
    const workPerPerson = calcWorkHoursPerPerson(); // shift - break - travel (egg collection)

    if ($("workHours")) {
      $("workHours").value =
        workPerPerson === "" ? "" : Number(workPerPerson).toFixed(2);
    }

    const labourHours =
      Number.isFinite(paidShiftPerPerson) && workers > 0
        ? paidShiftPerPerson * workers
        : "";

    if ($("labourHours")) {
      $("labourHours").value =
        labourHours === "" ? "" : Number(labourHours).toFixed(2);
    }

    if ($("totalHoursOut")) $("totalHoursOut").textContent = fmt(labourHours);

    // Egg Collection: averages use productive work time (excluding travel)
    if (type === "Egg Collection") {
      const eggs = Number.isFinite(totalEggs) ? totalEggs : 0;
      const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;

      const avgHr = w > 0 ? eggs / w : "";
      const avgPerson = workers > 0 ? eggs / workers : "";

      if ($("avgEggsHourOut")) $("avgEggsHourOut").textContent = fmt(avgHr);
      if ($("avgEggsPersonOut"))
        $("avgEggsPersonOut").textContent = fmt(avgPerson);
    }

    // Washing
    if (type === "Washing") {
      const dirty = nval("dirtyEggs");
      const washed = nval("washedEggs");
      const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;

      const broken =
        Number.isFinite(dirty) && Number.isFinite(washed)
          ? Math.max(0, dirty - washed)
          : "";
      const rate = Number.isFinite(washed) && w > 0 ? washed / w : "";

      if ($("brokenEggsOut")) $("brokenEggsOut").textContent = fmt(broken);
      if ($("washRateOut")) $("washRateOut").textContent = fmt(rate);
    }

    // Packing
    if (type === "Packing") {
      const packed = nval("eggsPacked");
      const w = Number.isFinite(workPerPerson) ? workPerPerson : 0;
      const rate = Number.isFinite(packed) && w > 0 ? packed / w : "";
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
    if (!canvas || !ctx) return;
    drawing = true;
    last = getPos(e);
    e.preventDefault();
  }

  function moveDraw(e) {
    if (!drawing || !canvas || !ctx) return;
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
    if (e) e.preventDefault();
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

    for (const id of FLOCK_INPUT_IDS) {
      if ($(id)) $(id).value = "0";
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
      if (status) status.textContent = "❌ Web App URL missing in code";
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
    const travelFinal =
      workType === "Egg Collection" ? Number(nval("travelHours") || 0) : 0;

    const paidShiftPerPerson = calcPaidShiftHoursPerPerson(); // shift - break
    const workPerPerson = calcWorkHoursPerPerson(); // productive per person

    const labourHours =
      Number.isFinite(paidShiftPerPerson) && workers > 0
        ? paidShiftPerPerson * workers
        : "";

    const eggsCollected = calcTotalEggsFromFlocks();

    const flockBreakdown = {};
    for (const id of FLOCK_INPUT_IDS) flockBreakdown[id] = Number(nval(id) || 0);

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

      eggsCollected: eggsCollected,
      eggsF43: flockBreakdown.eggsF43,
      eggsF41: flockBreakdown.eggsF41,
      eggsF36: flockBreakdown.eggsF36,
      eggsF44: flockBreakdown.eggsF44,
      eggsF24: flockBreakdown.eggsF24,
      eggsF35: flockBreakdown.eggsF35,
      eggsF45: flockBreakdown.eggsF45,
      eggsF48: flockBreakdown.eggsF48,

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

      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body,
      });

      if (status) status.textContent = "✅ Submitted! (Saved to sheet)";
      resetFormKeepDateAndSubmitter();
    } catch (e) {
      if (status) status.textContent = "❌ Network error: " + String(e);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ---------- Init ----------
  window.addEventListener("load", () => {
    const t = todayISO();

    if ($("date")) $("date").value = t;
    if ($("todayPill")) $("todayPill").textContent = `Today: ${t}`;

    // Signature setup
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
    }

    if ($("clearSig")) $("clearSig").addEventListener("click", clearSignature);
    if ($("submitBtn")) $("submitBtn").addEventListener("click", submitDiary);

    // Work type switching
    if ($("workType")) {
      showSection($("workType").value);
      $("workType").addEventListener("change", (e) => showSection(e.target.value));
    }

    // Recalc on relevant inputs
    const idsToWatch = [
      "numWorkers",
      "workerNames",
      "startTime",
      "endTime",
      "breakMins",
      "travelHours",
      ...FLOCK_INPUT_IDS,
      "dirtyEggs",
      "washedEggs",
      "eggsPacked",
    ];

    idsToWatch.forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("input", recalc);
    });

    calcTotalEggsFromFlocks();
    recalc();
  });
})();
