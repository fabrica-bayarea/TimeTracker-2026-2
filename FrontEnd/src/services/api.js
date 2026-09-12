import { safeIsoDate } from "../utils/dashboard";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getPreviousDateKeys(date, count) {
  const sanitized = safeIsoDate(date);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sanitized);

  if (!match) {
    throw new Error("A data do painel deve estar no formato AAAA-MM-DD.");
  }

  const [, year, month, day] = match;
  const selectedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

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
  const sanitizedDate = safeIsoDate(date);
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  // Busca os 6 dias anteriores ao dia selecionado
  const priorDates = getPreviousDateKeys(sanitizedDate, 7).slice(0, 6);

  // O resumo diário da data selecionada é a requisição principal
  const summaryPromise = requestJson(
    `/dashboard/summary?date=${encodeURIComponent(sanitizedDate)}${usernameQuery}`,
    signal,
  );

  // Requisições secundárias tratadas com resiliência para não derrubar o dashboard
  const realtimePromise = requestJson("/activities/realtime", signal).catch((error) => {
    if (error.name === "AbortError") throw error;
    console.warn("Falha ao consultar atividades em tempo real:", error);
    return [];
  });

  const usersPromise = requestJson("/users/", signal).catch((error) => {
    if (error.name === "AbortError") throw error;
    console.warn("Falha ao consultar lista de colaboradores:", error);
    return [];
  });

  const weeklyPromises = priorDates.map((day) =>
    requestJson(`/dashboard/summary?date=${day}${usernameQuery}`, signal).catch((error) => {
      if (error.name === "AbortError") throw error;
      console.warn(`Falha ao consultar resumo do dia ${day}:`, error);
      return { date: day, users: [] };
    }),
  );

  return Promise.all([
    summaryPromise,
    realtimePromise,
    usersPromise,
    Promise.all(weeklyPromises),
  ]).then(([summary, realtime, users, priorWeeklySummaries]) => {
    const normalizedSummary = { ...summary, users: asArray(summary?.users) };
    return {
      summary: normalizedSummary,
      realtime: asArray(realtime),
      users: asArray(users),
      // Compõe os 7 dias completos: 6 anteriores + dia atual sem duplicar requisição
      weeklySummaries: [
        ...priorWeeklySummaries.map((item) => ({
          ...item,
          users: asArray(item?.users),
        })),
        normalizedSummary,
      ],
    };
  });
}

export function getReportUrl(format, date, username = "") {
  const sanitizedDate = safeIsoDate(date);
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  return `${API_BASE_URL}/dashboard/export/${format}?date=${encodeURIComponent(sanitizedDate)}${usernameQuery}`;
}
