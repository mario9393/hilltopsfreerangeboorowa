const FLOCK_ARRIVAL_DATES = {
  "Flock 24": "2023-01-01",
  "Flock 29": "2023-11-01",
  "Flock 32": "2023-11-10",
  "Flock 34": "2024-01-01",
  "Flock 35": "2024-01-08",
  "Flock 36": "2024-01-15",
  "Flock 37": "2024-01-22",
  "Flock 38": "2024-05-01",
  "Flock 39": "2024-07-01",
  "Flock 40": "2024-11-01",
  "Flock 41": "2025-01-01",
  "Flock 42": "2025-01-15",
  "Flock 43": "2025-02-01",
  "Flock 44": "2025-04-01",
  "Flock 45": "2025-06-16",
  "Flock 46": "2025-07-01"
};

function getChickenAgeWeeks(flockId) {
  const arrival = new Date(FLOCK_ARRIVAL_DATES[flockId]);
  const today = new Date();
  const weeksSinceArrival = Math.floor((today - arrival) / (7 * 24 * 60 * 60 * 1000));
  return 20 + (weeksSinceArrival >= 0 ? weeksSinceArrival : 0); // prevent negative age
}
