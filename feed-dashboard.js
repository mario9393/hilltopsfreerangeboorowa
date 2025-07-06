const FEED_DATA_URL = "https://script.google.com/macros/s/AKfycby_YtaDVaOSzqqfYCTAnkb6FsAQCTdU7juAzEE94KaGNhJZJi1XIEitZGhtfGPGtHp6/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch(FEED_DATA_URL);
  const data = await response.json();
  const dashboard = document.getElementById("dashboard");

  const feedersByFlock = {};

  // Group feeders by flock from feeder_data.js
  FEEDERS.forEach(f => {
    if (!feedersByFlock[f.flockId]) feedersByFlock[f.flockId] = [];
    feedersByFlock[f.flockId].push(f.feederId);
  });

  Object.entries(feedersByFlock).forEach(([flockId, feederIds], index) => {
    const section = document.createElement("div");
    section.className = "flock-section";

    const canvas = document.createElement("canvas");
    canvas.id = `chart-${index}`;
    section.appendChild(canvas);

    const refill = document.createElement("div");
    refill.className = "refill-date";

    const labels = [];
    const levels = [];
    const refillDates = [];

    feederIds.forEach(feederId => {
      const entry = data[feederId];
      if (entry) {
        const level = parseFloat(entry["Level After Fill (%)"]) || 0;
        labels.push(feederId);
        levels.push(level);

        // Calculate refill date
        const remainingKg = (level / 100) * 1500;
        const daysLeft = remainingKg / 70.8;
        const refillDate = new Date();
        refillDate.setDate(refillDate.getDate() + Math.floor(daysLeft));
        refillDates.push(`${feederId}: ${refillDate.toDateString()}`);
      }
    });

    refill.innerHTML = refillDates.join(" &nbsp;|&nbsp; ");
    section.appendChild(refill);
    dashboard.appendChild(section);

    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Fill Level (%)",
          data: levels,
          backgroundColor: levels.map(v => v < 30 ? "red" : "#4caf50")
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  });
});
