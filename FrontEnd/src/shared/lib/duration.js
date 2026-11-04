export function fmtDuration(seconds = 0) {
  const value = Number(seconds);
  if (!Number.isSafeInteger(value) || value < 0) return '—';
  if (value > 0 && value < 60) return `${value}s`;
  return `${Math.floor(value / 3600)}h ${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}min`;
}
