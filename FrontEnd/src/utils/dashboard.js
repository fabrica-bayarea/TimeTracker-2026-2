const NON_PRODUCTIVE_CATEGORIES = new Set(["Social", "Outros"]);

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

export function getSummaryTotalSeconds(summary) {
  return (summary?.users ?? []).reduce(
    (total, user) => total + (Number(user.total_seconds) || 0),
    0,
  );
}

export function getProductiveSeconds(summary) {
  return (summary?.users ?? []).reduce(
    (total, user) =>
      total +
      (user.by_category ?? [])
        .filter((category) => !NON_PRODUCTIVE_CATEGORIES.has(category.category))
        .reduce(
          (categoryTotal, category) =>
            categoryTotal + (Number(category.total_seconds) || 0),
          0,
        ),
    0,
  );
}

/**
 * Formata os segundos de inatividade em uma string relativa legível
 * Ex: 45 -> "há 45s", 130 -> "há 2min", 3600 -> "há 1h", 3720 -> "há 1h 2min"
 */
export function formatRelativeActivityTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `há ${hours}h`;
  return `há ${hours}h ${remainingMinutes}min`;
}

/**
 * Valida se uma string de data é válida (AAAA-MM-DD); caso contrário, retorna a data local atual.
 */
export function safeIsoDate(dateString) {
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return dateString;
    }
  }
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Retorna a data local no formato ISO (AAAA-MM-DD).
 * Mantido como alias de compatibilidade para consumidores legados.
 */
export function getLocalIsoDate() {
  return safeIsoDate();
}
