const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPreviousDateKeys(date, count) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error("A data do painel deve estar no formato AAAA-MM-DD.");
  }

  const [, year, month, day] = match;
  const selectedDate = new Date(Date.UTC(year, Number(month) - 1, day));

  if (
    Number.isNaN(selectedDate.getTime()) ||
    selectedDate.getUTCFullYear() !== Number(year) ||
    selectedDate.getUTCMonth() !== Number(month) - 1 ||
    selectedDate.getUTCDate() !== Number(day)
  ) {
    throw new Error("A data do painel é inválida.");
  }

  return Array.from({ length: count }, (_, index) => {
    const currentDate = new Date(selectedDate);
    currentDate.setUTCDate(selectedDate.getUTCDate() - (count - 1 - index));
    return currentDate.toISOString().slice(0, 10);
  });
}

async function requestJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`API respondeu com status ${response.status}`);
  }

  return response.json();
}

export function fetchDashboardData(date, username = "", signal) {
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  const dates = getPreviousDateKeys(date, 7);

  return Promise.all([
    requestJson(`/dashboard/summary?date=${encodeURIComponent(date)}${usernameQuery}`, signal),
    requestJson("/activities/realtime", signal),
    requestJson("/users/", signal),
    ...dates.map((day) =>
      requestJson(`/dashboard/summary?date=${day}${usernameQuery}`, signal),
    ),
  ]).then(([summary, realtime, users, ...weeklySummaries]) => ({
    summary: { ...summary, users: asArray(summary?.users) },
    realtime: asArray(realtime),
    users: asArray(users),
    weeklySummaries: weeklySummaries.map((weeklySummary) => ({
      ...weeklySummary,
      users: asArray(weeklySummary?.users),
    })),
  }));
}

export function getReportUrl(format, date, username = "") {
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  return `${API_BASE_URL}/dashboard/export/${format}?date=${encodeURIComponent(date)}${usernameQuery}`;
}
