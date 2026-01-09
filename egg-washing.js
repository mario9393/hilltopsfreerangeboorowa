const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzuYDGdrFOE0kTnRNsRfvXjvFWn9OrX-XSRCjvYvXlItOtj-h1urs7iN5yTb4QbJo_M/exec";

function submitForm() {
  const data = {
    staffName: staffName.value.trim(),
    date: date.value,
    startTime: startTime.value,
    endTime: endTime.value,
    temp1: temp1.value,
    temp2: temp2.value,
    temp3: temp3.value,
    useChemicals: useChemicals.value,
    ph1: ph1.value,
    ph2: ph2.value,
    ph3: ph3.value,
    waterChangedTimes: waterChangedTimes.value,
    eggsDried: eggsDried.value,
    crackedRemoved: crackedRemoved.value,
    notes: notes.value
  };

  if (!data.staffName || !data.date || !data.startTime || !data.endTime) {
    msg.innerHTML = "<p class='err'>Please fill required fields</p>";
    return;
  }

  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(r => r.json())
  .then(res => {
    msg.innerHTML = res.ok
      ? "<p class='ok'>Saved successfully ✅</p>"
      : "<p class='err'>Error saving data</p>";
  });
}
