/** Format seconds elapsed since an activity record, as supplied by the API. */
export function formatLastRead(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.floor(seconds)}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min atrás` : `${hours}h atrás`;
}

/** Advance the API age by monotonic session time elapsed since its response arrived. */
export function formatLastReadAt(seconds, observedAt, now) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';

  if (!Number.isFinite(observedAt) || !Number.isFinite(now)) return formatLastRead(seconds);

  const elapsedSeconds = Math.max(0, Math.floor((now - observedAt) / 1000));
  return formatLastRead(seconds + elapsedSeconds);
}

/** Format when the frontend received a valid API response in the product timezone. */
export function formatQueryUpdatedAt(timestamp) {
  const timestampMs = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(timestampMs));
}
