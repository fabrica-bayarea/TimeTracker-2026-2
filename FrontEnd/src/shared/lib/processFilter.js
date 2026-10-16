/** @param {unknown} value */
export function formatProcessName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Keep options with visually identical labels distinguishable without changing
 * the raw process identifier used as the select value or filter key.
 * @param {unknown} value
 * @param {unknown} options
 */
export function formatProcessOption(value, options = []) {
  const label = formatProcessName(value);
  if (!label || !Array.isArray(options)) return label;

  const duplicateLabel = options.some(
    (option) => option !== value && formatProcessName(option) === label,
  );
  const rawIdentifier = JSON.stringify(value).replace(/ /g, '␠');
  return duplicateLabel ? `${label} (${rawIdentifier})` : label;
}

/**
 * Keep the raw process name as the option value. Formatting is only for the
 * label shown to the user; the API identifier remains untouched.
 * @param {unknown} people
 */
export function getRealtimeProcessOptions(people) {
  const names = new Set();
  for (const person of Array.isArray(people) ? people : []) {
    const processName = person?.realtime?.process_name;
    if (typeof processName === 'string' && processName.trim()) names.add(processName);
  }

  return [...names].sort(
    (left, right) =>
      formatProcessName(left).localeCompare(formatProcessName(right), 'pt-BR', {
        sensitivity: 'base',
      }) || left.localeCompare(right),
  );
}

/** @param {unknown} people @param {string} selectedProcess */
export function filterPeopleByProcess(people, selectedProcess) {
  const list = Array.isArray(people) ? people : [];
  if (!selectedProcess) return list;
  return list.filter((person) => person?.realtime?.process_name === selectedProcess);
}
