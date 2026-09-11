const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function requestJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`API respondeu com status ${response.status}`);
  }

  return response.json();
}

export function fetchDashboardData(date, username = "", signal) {
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  const selectedDate = new Date(`${date}T12:00:00`);
  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(selectedDate);
    day.setDate(selectedDate.getDate() - (6 - index));
    return day.toISOString().slice(0, 10);
  });

  return Promise.all([
    requestJson(`/dashboard/summary?date=${encodeURIComponent(date)}${usernameQuery}`, signal),
    requestJson("/activities/realtime", signal),
    requestJson("/users/", signal),
    ...dates.map((day) =>
      requestJson(`/dashboard/summary?date=${day}${usernameQuery}`, signal),
    ),
  ]).then(([summary, realtime, users, ...weeklySummaries]) => ({
    summary,
    realtime,
    users,
    weeklySummaries,
  }));
}

export function getReportUrl(format, date, username = "") {
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  return `${API_BASE_URL}/dashboard/export/${format}?date=${encodeURIComponent(date)}${usernameQuery}`;
}
