
document.addEventListener("DOMContentLoaded", () => {
  const feederSelect = document.getElementById("feederId");
  const flockIdInput = document.getElementById("flockId");
  const dateInput = document.getElementById("date");
  const beforeFillInput = document.getElementById("beforeFill");
  const afterFillInput = document.getElementById("afterFill");
  const amountFilledSpan = document.getElementById("amountFilled");
  const daysUntilEmptySpan = document.getElementById("daysUntilEmpty");
  const messageDiv = document.getElementById("message");

  const FEEDER_CAPACITY = 1500;
  const DAILY_REQUIREMENT = 2400 * 0.118;

  // NEW: Additional inputs
  const cleanedInsideInput = document.getElementById("cleanedInside");
  const stateBeforeCleaningInput = document.getElementById("stateBeforeCleaning");
  const stateAfterCleaningInput = document.getElementById("stateAfterCleaning");
  const stateIfNotCleanedInput = document.getElementById("stateIfNotCleaned");
  const needCleaningLaterInput = document.getElementById("needCleaningLater");
  const slotsCheckedInput = document.getElementById("slotsChecked");
  const slotsConditionInput = document.getElementById("slotsCondition");
  const submittedByInput = document.getElementById("submittedBy");

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

  feederSelect.addEventListener("change", () => {
    const selectedOption = feederSelect.selectedOptions[0];
    flockIdInput.value = selectedOption.dataset.flockId;
  });

  cleanedInsideInput.addEventListener("change", () => {
    const isYes = cleanedInsideInput.value === "Yes";
    document.getElementById("ifCleanedFields").style.display = isYes ? "block" : "none";
    document.getElementById("ifNotCleanedFields").style.display = isYes ? "none" : "block";
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
      "Daily Requirement (kg)": DAILY_REQUIREMENT.toFixed(1),
      "Days Until Empty": daysUntilEmpty.toFixed(1),

      // NEW FIELDS
      "Cleaned Inside Feeder Tank": cleanedInsideInput.value,
      "State Before Cleaning": stateBeforeCleaningInput.value,
      "State After Cleaning": stateAfterCleaningInput.value,
      "State If Not Cleaned": stateIfNotCleanedInput.value,
      "Require Cleaning Later": needCleaningLaterInput.value,
      "Cleaned & Checked Feeding Slots": slotsCheckedInput.value,
      "Feeding Slots Condition": slotsConditionInput.value,
      "Submitted By": submittedByInput.value
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbwj1CMlmqkeiPoqkrqxT4yHdnuIkIamdkToab13_A0NURPqSpFIYEX2SRPXt2xdAxXC7g/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      messageDiv.textContent = "✅ Feed log submitted!";
      document.getElementById("feedForm").reset();
      amountFilledSpan.textContent = "-";
      daysUntilEmptySpan.textContent = "-";
    } catch (err) {
      messageDiv.textContent = "❌ Error submitting log.";
    }
  });
});
