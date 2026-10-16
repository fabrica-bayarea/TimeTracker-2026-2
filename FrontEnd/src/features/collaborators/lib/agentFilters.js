const statusLabels = {
  online: 'Online',
  ausente: 'Ausente',
  offline: 'Offline (API)',
  'no-data': 'Sem dados',
  unavailable: 'Indisponível',
};

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function getCollaboratorStatus(person, realtimeAvailable) {
  if (!realtimeAvailable) return 'unavailable';
  return ['online', 'ausente', 'offline', 'no-data'].includes(person?.status)
    ? person.status
    : 'unavailable';
}

export function getCollaboratorStatusLabel(status) {
  return statusLabels[status] || statusLabels.unavailable;
}

function compareName(left, right) {
  const a = left.full_name || left.username || '';
  const b = right.full_name || right.username || '';
  return (
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) ||
    String(left.username || '').localeCompare(String(right.username || ''), 'pt-BR')
  );
}

function readAge(person) {
  const age = person?.realtime?.seconds_since_last_activity;
  return Number.isFinite(age) && age >= 0 ? age : Number.POSITIVE_INFINITY;
}

function compareAge(left, right, oldestFirst) {
  const leftAge = readAge(left);
  const rightAge = readAge(right);
  const leftUnknown = !Number.isFinite(leftAge);
  const rightUnknown = !Number.isFinite(rightAge);
  if (leftUnknown && rightUnknown) return compareName(left, right);
  if (leftUnknown) return 1;
  if (rightUnknown) return -1;
  return (oldestFirst ? rightAge - leftAge : leftAge - rightAge) || compareName(left, right);
}

/** Filter and sort the latest collaborator view using only fields from current API responses. */
export function filterCollaborators(
  people,
  { query = '', status = '', process = '', sort = 'name', realtimeAvailable = true } = {},
) {
  const normalizedQuery = normalizeSearch(query);
  const filtered = (Array.isArray(people) ? people : []).filter((person) => {
    const searchText = normalizeSearch(
      [person?.username, person?.full_name, person?.department].filter(Boolean).join(' '),
    );
    const statusMatches = !status || getCollaboratorStatus(person, realtimeAvailable) === status;
    const processName = person?.realtime?.process_name;
    const processMatches = !process || processName === process;
    return (
      (!normalizedQuery || searchText.includes(normalizedQuery)) && statusMatches && processMatches
    );
  });

  if (sort === 'recent') {
    return [...filtered].sort((left, right) => compareAge(left, right, false));
  }
  if (sort === 'oldest') {
    return [...filtered].sort((left, right) => compareAge(left, right, true));
  }
  return [...filtered].sort(compareName);
}
