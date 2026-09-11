const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function requestJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`API respondeu com status ${response.status}`);
  }

  return response.json();
}

export function fetchDashboardData(date, signal) {
  return Promise.all([
    requestJson(`/dashboard/summary?date=${encodeURIComponent(date)}`, signal),
    requestJson("/activities/realtime", signal),
  ]).then(([summary, realtime]) => ({ summary, realtime }));
}

export function getReportUrl(format, date) {
  return `${API_BASE_URL}/dashboard/export/${format}?date=${encodeURIComponent(date)}`;
}
