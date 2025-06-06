
document.addEventListener("DOMContentLoaded", () => {
  const feederSelect = document.getElementById("feederId");
  const flockIdInput = document.getElementById("flockId"); // NEW: input element to show flock ID
  const dateInput = document.getElementById("date");
  const beforeFillInput = document.getElementById("beforeFill");
  const afterFillInput = document.getElementById("afterFill");
  const amountFilledSpan = document.getElementById("amountFilled");
  const daysUntilEmptySpan = document.getElementById("daysUntilEmpty");
  const messageDiv = document.getElementById("message");

  const FEEDER_CAPACITY = 1500;
  const DAILY_REQUIREMENT = 2400 * 0.118;

  FEEDERS.forEach(f => {
    const option = document.createElement("option");
    option.value = f.feederId;
    option.textContent = f.feederId;
    option.dataset.flockId = f.flockId;
    option.dataset.lat = f.lat;
    option.dataset.lng = f.lng;
    feederSelect.appendChild(option);
  });

  dateInput.valueAsDate = new Date();

  // ✅ Auto-fill flock ID when feeder is selected
  feederSelect.addEventListener("change", () => {
    const selectedOption = feederSelect.selectedOptions[0];
    flockIdInput.value = selectedOption.dataset.flockId;
  });

  function calculate() {
    const before = parseFloat(beforeFillInput.value);
    const after = parseFloat(afterFillInput.value);
    if (!isNaN(before) && !isNaN(after) && after >= before) {
      const filled = ((after - before) / 100) * FEEDER_CAPACITY;
      const days = ((after / 100) * FEEDER_CAPACITY) / DAILY_REQUIREMENT;
      amountFilledSpan.textContent = filled.toFixed(1) + " kg";
      daysUntilEmptySpan.textContent = days.toFixed(1) + " days";
    } else {
      amountFilledSpan.textContent = "-";
      daysUntilEmptySpan.textContent = "-";
    }
  }

  beforeFillInput.addEventListener("input", calculate);
  afterFillInput.addEventListener("input", calculate);

  document.getElementById("feedForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const feederId = feederSelect.value;
    const selectedOption = feederSelect.selectedOptions[0];
    const flockId = selectedOption.dataset.flockId;
    const lat = selectedOption.dataset.lat;
    const lng = selectedOption.dataset.lng;
    const date = dateInput.value;
    const before = beforeFillInput.value;
    const after = afterFillInput.value;
    const amountFilled = ((after - before) / 100) * FEEDER_CAPACITY;
    const daysUntilEmpty = ((after / 100) * FEEDER_CAPACITY) / DAILY_REQUIREMENT;

    const payload = {
      "Feeder ID": feederId,
      "Flock ID": flockId,
      "Latitude": lat,
      "Longitude": lng,
      "Date": date,
      "Level Before Fill (%)": before,
      "Level After Fill (%)": after,
      "Amount Filled (kg)": amountFilled.toFixed(1),
      "Daily Feed Requirement (kg)": DAILY_REQUIREMENT.toFixed(1),
      "Days Until Empty": daysUntilEmpty.toFixed(1)
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbwj1CMlmqkeiPoqkrqxT4yHdnuIkIamdkToab13_A0NURPqSpFIYEX2SRPXt2xdAxXC7g/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      messageDiv.textContent = "✅ Feed log submitted!";
    } catch (err) {
      messageDiv.textContent = "❌ Error submitting log.";
    }
  });
});
