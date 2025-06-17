// dashboard.js
// Assumes Chart.js is already loaded in HTML

async function fetchSheetCSV(sheetUrl) {
  const response = await fetch(sheetUrl);
  const text = await response.text();
  return text.split("\n").map(row => row.split(","));
}

function parseDate(dateStr) {
  const parts = dateStr.split("/");
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

function groupEggsByFlockAndDate(data) {
  const header = data[0];
  const dateIdx = header.indexOf("Date");
  const flockIdx = header.indexOf("Flock");
  const eggsIdx = header.indexOf("Total Eggs");

  const result = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = row[dateIdx];
    const flock = row[flockIdx];
    const eggs = parseInt(row[eggsIdx], 10) || 0;

    if (!result[date]) result[date] = {};
    if (!result[date][flock]) result[date][flock] = 0;
    result[date][flock] += eggs;
  }

  return result;
}

function plotEggCharts(data) {
  const flockDailyCounts = groupEggsByFlockAndDate(data);
  const dates = Object.keys(flockDailyCounts).sort((a, b) => new Date(a) - new Date(b));

  const flocks = new Set();
  dates.forEach(date => Object.keys(flockDailyCounts[date]).forEach(f => flocks.add(f)));

  const datasets = Array.from(flocks).map(flock => {
    return {
      label: flock,
      data: dates.map(date => flockDailyCounts[date][flock] || 0),
      fill: false,
      borderWidth: 2
    };
  });

  new Chart(document.getElementById('eggsPerFlockChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: dates,
      datasets
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Daily Egg Count by Flock' } }
    }
  });

  const totalEggs = dates.map(date => Object.values(flockDailyCounts[date]).reduce((a, b) => a + b, 0));

  new Chart(document.getElementById('eggsTotalChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{ label: 'Total Eggs', data: totalEggs, backgroundColor: '#4caf50' }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Total Eggs Collected Daily' } }
    }
  });
}

function groupFeedLevels(data) {
  const header = data[0];
  const feederIdx = header.indexOf("Feeder ID");
  const afterFillIdx = header.indexOf("Level After Fill (kg)");
  const dateIdx = header.indexOf("Date");

  const latest = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const feeder = row[feederIdx];
    const level = parseFloat(row[afterFillIdx]) || 0;
    const date = row[dateIdx];

    if (!latest[feeder] || parseDate(date) > parseDate(latest[feeder].date)) {
      latest[feeder] = { level, date };
    }
  }

  return latest;
}

function plotFeedChart(data) {
  const latest = groupFeedLevels(data);
  const labels = Object.keys(latest);
  const levels = labels.map(f => latest[f].level);

  new Chart(document.getElementById('feedLevelsChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Current Feed Level (kg)', data: levels, backgroundColor: '#2196f3' }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Latest Feed Levels per Feeder' } }
    }
  });
}

function groupWaterLevels(data) {
  const header = data[0];
  const flockIdx = header.indexOf("Flock ID");
  const levelIdx = header.indexOf("Water Tank Fill (%)");
  const dateIdx = header.indexOf("Date");

  const latest = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const flock = row[flockIdx];
    const level = parseFloat(row[levelIdx]) || 0;
    const date = row[dateIdx];

    if (!latest[flock] || parseDate(date) > parseDate(latest[flock].date)) {
      latest[flock] = { level, date };
    }
  }
  return latest;
}

function plotWaterChart(data) {
  const latest = groupWaterLevels(data);
  const labels = Object.keys(latest);
  const levels = labels.map(f => latest[f].level);

  new Chart(document.getElementById('waterLevelsChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Current Water Tank Fill (%)', data: levels, backgroundColor: '#00bcd4' }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Latest Water Levels per Flock' } }
    }
  });
}

// Load and draw charts
window.addEventListener('DOMContentLoaded', async () => {
  const [eggData, feedData, waterData] = await Promise.all([
    fetchSheetCSV("https://docs.google.com/spreadsheets/d/e/2PACX-1vQRb3Xhvuu0KTGYETnei-bDwxd1we6bL7SwLDZzZEelb8Q_DkhJT4YcXHZJsiI7HmNOamK-KRMCz1C2/pub?output=csv"),
    fetchSheetCSV("https://docs.google.com/spreadsheets/d/e/2PACX-1vQINARyh9GBZ04CbNhrweG37B14hIuPcP_qZTQHQ0wdmJvx0qqhBUXuSqESfg9djz4nBEkzgMUfvJcL/pub?output=csv"),
    fetchSheetCSV("https://docs.google.com/spreadsheets/d/e/2PACX-1vQb8TqZrPKm1NKov2s1Y3kHgOLmuqfVJ1a9fbo0b7M1wMDnQ4sx3NWB8UihRzDmLs4jO5UtiLLaMqj8/pub?output=csv")
  ]);

  plotEggCharts(eggData);
  plotFeedChart(feedData);
  plotWaterChart(waterData);
});
