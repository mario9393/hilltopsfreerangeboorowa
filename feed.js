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

  let submitterLat = "";
  let submitterLng = "";
  let proximityStatus = "Unknown";

  // Helper to calculate distance between two coordinates (in meters)
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Ask for GPS access once when page loads
  function requestLocation() {
    if (!navigator.geolocation) {
      messageDiv.textContent = "❌ GPS not supported.";
      return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
      submitterLat = pos.coords.latitude;
      submitterLng = pos.coords.longitude;
      messageDiv.textContent = "📍 Location detected.";
    }, () => {
      proximityStatus = "Location Denied";
      messageDiv.textContent = "❌ Please allow location access.";
    });
  }

  // Call location request on page load
  requestLocation();

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
    const feederLat = parseFloat(selectedOption.dataset.lat);
    const feederLng = parseFloat(selectedOption.dataset.lng);

    if (submitterLat && submitterLng) {
      const distance = getDistance(submitterLat, submitterLng, feederLat, feederLng);
      proximityStatus = distance <= 100 ? "Near" : "Away"; // adjust 100m if needed
    }

    const payload = {
      "Feeder ID": feederSelect.value,
      "Flock ID": selectedOption.dataset.flockId,
      "Latitude": feederLat,
      "Longitude": feederLng,
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
      "Submitted By": submittedByInput.value,
      "Submitter Latitude": submitterLat || "",
      "Submitter Longitude": submitterLng || "",
      "Proximity Status": proximityStatus
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
      requestLocation(); // Ask for fresh location for next entry
    } catch (err) {
      messageDiv.textContent = "❌ Error submitting log.";
    }
  });
});
