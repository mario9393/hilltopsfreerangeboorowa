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

    const selectedOption = feederSelect.selectedOptions[0];
    const payload = {
      "Feeder ID": feederSelect.value,
      "Flock ID": selectedOption.dataset.flockId,
      "Latitude": selectedOption.dataset.lat,
      "Longitude": selectedOption.dataset.lng,
      "Date": dateInput.value,
      "Level Before Fill (%)": beforeFillInput.value,
      "Level After Fill (%)": afterFillInput.value,
      "Amount Filled (kg)": (((afterFillInput.value - beforeFillInput.value) / 100) * FEEDER_CAPACITY).toFixed(1),
      "Daily Requirement (kg)": DAILY_REQUIREMENT.toFixed(1),
      "Days Until Empty": (((afterFillInput.value / 100) * FEEDER_CAPACITY) / DAILY_REQUIREMENT).toFixed(1),
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
      await fetch("https://script.google.com/macros/s/AKfycby_YtaDVaOSzqqfYCTAnkb6FsAQCTdU7juAzEE94KaGNhJZJi1XIEitZGhtfGPGtHp6/exec", {
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
