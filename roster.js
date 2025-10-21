// ====== CONFIG ======
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwEc2kAoiL7wTKsic-0r1JYNpphQkq9myxr-QZcwDp-V_hmmAzUkVPFvbzfpb63khk/exec'; // <-- replace

// Default date = today (Sydney)
document.addEventListener('DOMContentLoaded', () => {
  const d = new Date();
  const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  document.getElementById('date').value = iso;

  ['start','end','breakMins'].forEach(id => document.getElementById(id).addEventListener('change', updateTotal));
  updateTotal();

  document.getElementById('timesheetForm').addEventListener('submit', onSubmit);
});

function parseHM(val) { // "09:50" -> minutes
  if (!val) return null;
  const [h,m] = val.split(':').map(Number);
  return h*60 + m;
}

function updateTotal() {
  const startM = parseHM(document.getElementById('start').value);
  const endM   = parseHM(document.getElementById('end').value);
  const breakM = Number(document.getElementById('breakMins').value || 0);

  let txt = '0h 00m';
  if (startM != null && endM != null) {
    let diff = endM - startM - breakM;
    if (diff < 0) diff += 24*60; // handle overnight (rare)
    const h = Math.floor(diff/60);
    const m = diff % 60;
    txt = `${h}h ${String(m).padStart(2,'0')}m`;
  }
  document.getElementById('totalText').textContent = txt;
}

async function onSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById('msg');
  msg.textContent = 'Submitting…';

  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const breakMins = Number(document.getElementById('breakMins').value || 0);
  const location = document.getElementById('location').value;
  const notes = document.getElementById('notes').value.trim();

  if (!name || !date || !start || !end || !location) {
    msg.textContent = 'Please complete all required fields.';
    msg.style.color = '#ffd166';
    return;
  }

  // Calculate total hours (decimal)
  const startM = parseHM(start);
  const endM   = parseHM(end);
  let minutes = endM - startM - breakMins;
  if (minutes < 0) minutes += 24*60;
  const totalHours = Math.round((minutes/60) * 100) / 100;

  const payload = {
    action: 'submit',
    name, date, start, end,
    breakMins, location, notes,
    totalHours
  };

  try {
    const res = await fetch(SCRIPT_URL, {
const res = await fetch(SCRIPT_URL, {
method: 'POST',
// no headers -> browser sends text/plain; no preflight
body: JSON.stringify(payload)
});
    const out = await res.json();
    if (out.ok) {
      msg.textContent = 'Timesheet submitted (Pending approval).';
      msg.style.color = '#7bd88f';
      // Optionally reset only times/notes
      // document.getElementById('notes').value = '';
    } else {
      msg.textContent = 'Error: ' + (out.error || 'unknown');
      msg.style.color = '#ff6b6b';
    }
  } catch (err) {
    msg.textContent = 'Network error: ' + err.message;
    msg.style.color = '#ff6b6b';
  }
}
