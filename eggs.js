document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eggForm");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");

  const clean = document.getElementById("clean");
  const dirty = document.getElementById("dirty");
  const superDirty = document.getElementById("superDirty");
  const ground = document.getElementById("ground");
  const broken = document.getElementById("broken");
  const giant = document.getElementById("giant");
  const totalSpan = document.getElementById("total");

  const urlParams = new URLSearchParams(window.location.search);
  const flock = urlParams.get("flock");
  if (flock) {
    document.getElementById("flockId").value = flock;
  }

function updateTotal() {
  // Only exclude broken eggs from total
  const total = [clean, dirty, superDirty, ground, giant].reduce((sum, field) => {
    return sum + (parseInt(field.value) || 0);
  }, 0);
  totalSpan.textContent = total;
}

  [clean, dirty, superDirty, ground, broken, giant].forEach(input => {
    input.addEventListener("input", updateTotal);
  });

  const now = new Date();
  dateInput.valueAsDate = now;
  timeInput.value = now.toTimeString().slice(0, 5);

  // Define known flock coordinates (replace with your real locations)
  const flockCoordinates = {
    "Flock 24": { lat: -34.352939, lng: 148.700403 },
    "Flock 29": { lat: -34.349811, lng: 148.701231 },
    "Flock 32": { lat: -34.345914, lng: 148.699978 },
    "Flock 34": { lat: -34.352742, lng: 148.695286 },
    "Flock 35": { lat: -34.351803, lng: 148.696808 },
    "Flock 36": { lat: -34.352922, lng: 148.703650 },
    "Flock 37": { lat: -34.351092, lng: 148.707942 },
    "Flock 38": { lat: -34.348275, lng: 148.701122 },
    "Flock 39": { lat: -34.350797, lng: 148.704897 },
    "Flock 40": { lat: -34.348503, lng: 148.702567 },
    "Flock 41": { lat: -34.353400, lng: 148.706169 },
    "Flock 42": { lat: -34.353883, lng: 148.705925 },
    "Flock 43": { lat: -34.353933, lng: 148.706528 },
    "Flock 44": { lat: -34.348578, lng: 148.705606 },
    "Flock 45": { lat: -34.345740, lng: 148.702910 },
    "Flock 46": { lat: -34.345625, lng: 148.702940 }
  };

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in meters
  }
  const submitButton = form.querySelector("button[type='submit']"); // ✅ Added
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitButton.disabled = true; // ✅ Added
    submitButton.textContent = "Submitting..."; // ✅ Added
    
    const flockId = form.flockId.value;
    const target = flockCoordinates[flockId];
    let latitude = "";
    let longitude = "";
    let proximityStatus = "Unknown";

    if (navigator.geolocation && target) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(position => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          const distance = getDistance(latitude, longitude, target.lat, target.lng);
          proximityStatus = distance <= 100 ? "Near" : "Away"; // 100 meters threshold
          resolve();
        }, () => {
          proximityStatus = "Location Denied";
          resolve();
        });
      });
    }

    const payload = {
      "Date": dateInput.value,
      "Time": timeInput.value,
      "Flock ID": flockId,
      "Collector": form.collector.value,
      "Team ID": form.teamId.value,
      "Clean Eggs": clean.value,
      "Dirty Eggs": dirty.value,
      "Super Dirty Eggs": superDirty.value,
      "Ground Eggs": ground.value,
      "Broken Eggs": broken.value,
      "Giant Eggs": giant.value,
      "Total Eggs": totalSpan.textContent,
      "Dead Chickens": form.dead.value,
      "Water Observations": form.water.value,
      "Feeder Observations": form.feeder.value,
      "Dog Fed": form.dog.value,
      "Time Leaving": form.leaveTime.value,
      "Latitude": latitude,
      "Longitude": longitude,
      "Proximity Status": proximityStatus
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbyX3KV4p2tGZY0u-IJOefKqQ2vJ1e_cwyyiXyVwYixbo7Nii_aON6nQ9D-UP5cgKMwb/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      document.getElementById("message").textContent = "✅ Submission successful!";
      form.reset();
      totalSpan.textContent = "0";
      submitButton.disabled = false; // ✅ Added
      submitButton.textContent = "Submit"; // ✅ Added
      
    } catch (err) {
      document.getElementById("message").textContent = "❌ Failed to submit.";
      submitButton.disabled = false; // ✅ Added
      submitButton.textContent = "Submit"; // ✅ Added
    }
  });
});
