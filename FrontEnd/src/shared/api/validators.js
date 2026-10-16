import { isIsoDate } from '../lib/date';

const BASE64URL_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const OFFSET_TIMESTAMP_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/i;
const TASK_DESCRIPTION_MAX_LENGTH = 200;

/** @param {unknown} value */
export function validJwtAccessToken(value) {
  if (typeof value !== 'string') return false;
  const segments = value.split('.');
  return (
    segments.length === 3 &&
    segments.every((segment) => BASE64URL_SEGMENT_PATTERN.test(segment) && segment.length % 4 !== 1)
  );
}

function optionalText(value) {
  return value == null || typeof value === 'string';
}

function optionalBoolean(value) {
  return value === undefined || typeof value === 'boolean';
}

function optionalDateTime(value) {
  return value == null || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
}

function uniqueUsers(value) {
  return (
    Array.isArray(value) &&
    value.every((user) => user && typeof user.username === 'string' && user.username.length > 0) &&
    new Set(value.map((user) => user.username)).size === value.length
  );
}

function validTimestamp(value) {
  return (
    typeof value === 'string' &&
    OFFSET_TIMESTAMP_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function timestampMatchesDate(value, date, timezone) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return date === `${values.year}-${values.month}-${values.day}`;
}

function uniqueBy(value, keyOf) {
  return Array.isArray(value) && new Set(value.map(keyOf)).size === value.length;
}

/** @param {unknown} value */
export function validTaskDescription(value) {
  if (typeof value !== 'string') return false;
  const description = value.trim();
  return description.length > 0 && Array.from(description).length <= TASK_DESCRIPTION_MAX_LENGTH;
}

/** @param {any} value @returns {value is import('./contracts').Task} */
export function validTask(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((field) =>
      ['id', 'description', 'created_at', 'updated_at'].includes(field),
    ) &&
    typeof value.id === 'string' &&
    UUID_PATTERN.test(value.id) &&
    validTaskDescription(value.description) &&
    validTimestamp(value.created_at) &&
    validTimestamp(value.updated_at),
  );
}

/** @param {any} value @returns {value is import('./contracts').Task[]} */
export function validTasks(value) {
  return Array.isArray(value) && value.every(validTask) && uniqueBy(value, (task) => task.id);
}

/** @param {any} value @returns {value is import('./contracts').Attendance} */
export function validAttendance(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.timezone === 'America/Sao_Paulo' &&
    isIsoDate(value.date) &&
    validTimestamp(value.as_of) &&
    Array.isArray(value.users) &&
    value.users.every((user) => {
      if (!user || typeof user.username !== 'string' || user.username.trim().length === 0) {
        return false;
      }

      const { first_activity_at: first, last_activity_at: last } = user;
      if (first === null && last === null) return true;
      if (!validTimestamp(first) || !validTimestamp(last)) return false;
      return (
        timestampMatchesDate(first, value.date, value.timezone) &&
        timestampMatchesDate(last, value.date, value.timezone) &&
        Date.parse(first) <= Date.parse(last)
      );
    }) &&
    uniqueBy(value.users, (user) => user.username),
  );
}

/** @param {any} value @returns {value is import('./contracts').TaskHours} */
export function validTaskHours(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isIsoDate(value.start_date) &&
    isIsoDate(value.end_date) &&
    value.start_date <= value.end_date &&
    value.timezone === 'America/Sao_Paulo' &&
    Array.isArray(value.tasks) &&
    value.tasks.every(
      (task) =>
        task &&
        typeof task.task_id === 'string' &&
        UUID_PATTERN.test(task.task_id) &&
        validTaskDescription(task.description) &&
        Number.isSafeInteger(task.total_seconds) &&
        task.total_seconds >= 0,
    ) &&
    uniqueBy(value.tasks, (task) => task.task_id),
  );
}

/** @param {any} value @returns {value is import('./contracts').AgentStatusResponse} */
export function validAgentStatuses(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray(value.agents) &&
    value.agents.every(
      (agent) =>
        agent &&
        typeof agent.username === 'string' &&
        agent.username.trim().length > 0 &&
        typeof agent.hostname === 'string' &&
        agent.hostname.trim().length > 0 &&
        (agent.last_record_at === null || validTimestamp(agent.last_record_at)) &&
        ['online', 'offline', 'unknown'].includes(agent.connection_status),
    ) &&
    uniqueBy(value.agents, (agent) => `${agent.username}|${agent.hostname}`),
  );
}

/** @param {any} value @returns {value is import('./contracts').User[]} */
export function validUsers(value) {
  return (
    uniqueUsers(value) &&
    value.every((user) => optionalText(user.full_name) && optionalText(user.department))
  );
}

/** @param {any} value @returns {value is import('./contracts').RealtimeEntry[]} */
export function validRealtime(value) {
  return (
    uniqueUsers(value) &&
    value.every(
      (entry) =>
        ['online', 'ausente', 'offline'].includes(entry.status) &&
        Number.isSafeInteger(entry.seconds_since_last_activity) &&
        entry.seconds_since_last_activity >= 0 &&
        optionalText(entry.process_name) &&
        optionalText(entry.window_title) &&
        optionalText(entry.hostname) &&
        optionalText(entry.category) &&
        optionalBoolean(entry.is_idle),
    )
  );
}

/** @param {any} value @returns {value is import('./contracts').DailySummary} */
export function validSummary(value) {
  return Boolean(
    value &&
    isIsoDate(value.date) &&
    uniqueUsers(value.users) &&
    value.users.every(
      (user) =>
        Number.isSafeInteger(user.total_seconds) &&
        user.total_seconds >= 0 &&
        Array.isArray(user.by_category) &&
        user.by_category.every(
          (category) =>
            category &&
            typeof category.category === 'string' &&
            (category.color === undefined || typeof category.color === 'string') &&
            Number.isSafeInteger(category.total_seconds) &&
            category.total_seconds >= 0,
        ),
    ),
  );
}

/** @param {any} value @returns {value is import('./contracts').SystemSettings} */
export function validSettings(value) {
  return (
    Number.isSafeInteger(value?.capture_interval_seconds) &&
    value.capture_interval_seconds > 0 &&
    Number.isSafeInteger(value?.idle_timeout_seconds) &&
    value.idle_timeout_seconds > 0 &&
    optionalDateTime(value.updated_at)
  );
}

/** @param {any} value @returns {value is import('./contracts').Manager} */
export function validManager(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((field) => ['id', 'email', 'created_at'].includes(field)) &&
    typeof value.id === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value.id) &&
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    !/\s/.test(value.email) &&
    value.email.includes('@') &&
    typeof value.created_at === 'string' &&
    Number.isFinite(Date.parse(value.created_at)),
  );
}

/** @param {any} value @returns {value is import('./contracts').ManagerToken} */
export function validManagerToken(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((field) =>
      ['access_token', 'token_type', 'expires_in'].includes(field),
    ) &&
    validJwtAccessToken(value.access_token) &&
    value.token_type === 'bearer' &&
    Number.isSafeInteger(value.expires_in) &&
    value.expires_in > 0,
  );
}
