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
