// 1) Paste your Apps Script Web App URL here:
const WEB_APP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

let loggedIn = false;
let loginName = "";
let loginPin = "";

const $ = (id) => document.getElementById(id);

const canvas = $("sigCanvas");
const signaturePad = new window.SignaturePad(canvas, { minWidth: 1, maxWidth: 2 });

// Resize canvas for crisp signature
function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  signaturePad.clear();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Default date to today (Sydney local)
(function setToday() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  $("date").value = `${yyyy}-${mm}-${dd}`;
})();

// Login button
$("loginBtn").addEventListener("click", async () => {
  loginName = $("loginName").value.trim();
  loginPin = $("loginPin").value.trim();

  if (!loginName || !loginPin) {
    $("loginMsg").innerHTML = `<span class="err">Enter name and PIN.</span>`;
    return;
  }

  // quick “test” login by calling backend with minimal payload
  const res = await postData({ loginName, loginPin, date: $("date").value });
  if (!res.ok) {
    $("loginMsg").innerHTML = `<span class="err">${res.error || "Login failed"}</span>`;
    return;
  }

  loggedIn = true;
  $("loginMsg").innerHTML = `<span class="ok">Login OK</span>`;
  $("loginBox").classList.add("hidden");
  $("formBox").classList.remove("hidden");
});

$("clearSigBtn").addEventListener("click", () => signaturePad.clear());

$("submitBtn").addEventListener("click", async () => {
  if (!loggedIn) return;

  // Basic required fields
  if (!$("date").value || !$("startTime").value || !$("endTime").value) {
    $("msg").innerHTML = `<span class="err">Please fill Date, Start Time, End Time.</span>`;
    return;
  }
  if (!$("eggsDried").value || !$("crackedRemoved").value) {
    $("msg").innerHTML = `<span class="err">Please select Eggs dried and Cracked eggs removed.</span>`;
    return;
  }
  if (signaturePad.isEmpty()) {
    $("msg").innerHTML = `<span class="err">Supervisor signature is required.</span>`;
    return;
  }

  const useChem = $("useChemicals").value;
  if (useChem === "Yes" && (!$("ph1").value && !$("ph2").value && !$("ph3").value)) {
    $("msg").innerHTML = `<span class="err">Chemicals = Yes. Please add at least one pH check.</span>`;
    return;
  }

  $("submitBtn").disabled = true;
  $("msg").innerHTML = `<span class="muted">Submitting...</span>`;

  const payload = {
    loginName,
    loginPin,

    date: $("date").value,
    startTime: $("startTime").value,
    endTime: $("endTime").value,

    temp1: $("temp1").value,
    temp2: $("temp2").value,
    temp3: $("temp3").value,

    useChemicals: useChem,
    ph1: $("ph1").value,
    ph2: $("ph2").value,
    ph3: $("ph3").value,

    waterChangedTimes: $("waterChangedTimes").value,
    eggsDried: $("eggsDried").value,
    crackedRemoved: $("crackedRemoved").value,

    supervisorName: $("supervisorName").value.trim(),
    supervisorSignature: signaturePad.toDataURL("image/png"),
    notes: $("notes").value.trim()
  };

  const res = await postData(payload);

  if (res.ok) {
    $("msg").innerHTML = `<span class="ok">Saved successfully ✅</span>`;
    signaturePad.clear();
    $("notes").value = "";
  } else {
    $("msg").innerHTML = `<span class="err">Error: ${res.error || "Failed to save"}</span>`;
  }

  $("submitBtn").disabled = false;
});

async function postData(payload) {
  try {
    const r = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
