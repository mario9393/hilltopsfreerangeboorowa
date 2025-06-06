
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eggForm");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");

  const clean = document.getElementById("clean");
  const dirty = document.getElementById("dirty");
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
    const total = [clean, dirty, ground, broken, giant].reduce((sum, field) => {
      return sum + (parseInt(field.value) || 0);
    }, 0);
    totalSpan.textContent = total;
  }

  [clean, dirty, ground, broken, giant].forEach(input => {
    input.addEventListener("input", updateTotal);
  });

  const now = new Date();
  dateInput.valueAsDate = now;
  timeInput.value = now.toTimeString().slice(0,5);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      "Date": dateInput.value,
      "Time": timeInput.value,
      "Flock ID": form.flockId.value,
      "Collector": form.collector.value,
      "Team ID": form.teamId.value,
      "Clean Eggs": clean.value,
      "Dirty Eggs": dirty.value,
      "Ground Eggs": ground.value,
      "Broken Eggs": broken.value,
      "Giant Eggs": giant.value,
      "Total Eggs": totalSpan.textContent,
      "Dead Chickens": form.dead.value,
      "Water Observations": form.water.value,
      "Feeder Observations": form.feeder.value,
      "Dog Fed": form.dog.value,
      "Time Leaving": form.leaveTime.value
    };

    try {
      await fetch("YOUR_GOOGLE_SCRIPT_WEBAPP_URL", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      document.getElementById("message").textContent = "✅ Submission successful!";
      form.reset();
      totalSpan.textContent = "0";
    } catch (err) {
      document.getElementById("message").textContent = "❌ Failed to submit.";
    }
  });
});
