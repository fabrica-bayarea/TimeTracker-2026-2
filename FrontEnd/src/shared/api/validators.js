import { isIsoDate } from '../lib/date';

const BASE64URL_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;

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

function uniqueUsers(value) {
  return (
    Array.isArray(value) &&
    value.every((user) => user && typeof user.username === 'string' && user.username.length > 0) &&
    new Set(value.map((user) => user.username)).size === value.length
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
        optionalText(entry.category),
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
    value.idle_timeout_seconds > 0
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

/** @param {any} value @returns {value is import('./contracts').ManagerProfile} */
export function validManagerProfile(value) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    optionalText(value.association_code)
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

/** @param {any} value @returns {value is import('./contracts').AuthToken} */
export function validAuthToken(value) {
  return Boolean(
    value &&
    typeof value.access_token === 'string' &&
    value.access_token.length > 0
  );
}

/** @param {any} value @returns {value is import('./contracts').Task} */
export function validTask(value) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.status === 'string'
  );
}

/** @param {any} value @returns {value is import('./contracts').Task[]} */
export function validTasks(value) {
  return Array.isArray(value) && value.every(validTask);
}
