import { isIsoDate } from '../lib/date';
import {
  validAuthToken,
  validJwtAccessToken,
  validManager,
  validManagerProfile,
  validManagerToken,
  validRealtime,
  validSettings,
  validSummary,
  validTask,
  validTasks,
  validUsers,
} from './validators';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT = 15000;
const TOKEN_KEY = 'timetracker_auth_token';

export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token, persist = false) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      if (persist) localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Falha silenciosa caso armazenamento esteja indisponível
  }
}

/**
 * @typedef {{ type?: import('./contracts').ApiErrorType, status?: number | null,
 *   statusText?: string, detail?: unknown, cause?: unknown }} ApiErrorOptions
 */

export class ApiError extends Error {
  /** @param {string} message @param {ApiErrorOptions} [options] */
  constructor(message, { type, status = null, statusText = '', detail = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }
}

/** @param {unknown} detail */
function detailMessage(detail) {
  if (typeof detail === 'string') return detail.trim().slice(0, 500);
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : ''))
      .filter(Boolean)
      .join('; ')
      .slice(0, 500);
  }
  return '';
}

/** @param {Response} response */
async function httpError(response, includeDetail = true) {
  let detail = null;
  if (includeDetail) {
    try {
      const body = await response.json();
      detail = body?.detail ?? null;
    } catch {
      // An empty or non-JSON error body still preserves the HTTP status.
    }
  }
  return new ApiError(detailMessage(detail) || `API respondeu ${response.status}`, {
    type: response.status >= 500 ? 'server' : 'client',
    status: response.status,
    statusText: response.statusText || '',
    detail,
  });
}

/**
 * @template T
 * @param {string} path
 * @param {RequestInit & { omitErrorDetails?: boolean }} [options]
 * @param {(response: Response) => Promise<T>} [read]
 * @returns {Promise<T>}
 */
async function request(
  path,
  { signal, omitErrorDetails = false, ...options } = {},
  read = (response) => response.json(),
) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    if (controller.signal.aborted) return;
    timedOut = true;
    controller.abort();
  }, TIMEOUT);
  try {
    controller.signal.throwIfAborted();
    const token = getStoredToken();
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
    controller.signal.throwIfAborted();
    if (!response.ok) throw await httpError(response, !omitErrorDetails);
    try {
      const value = await read(response);
      controller.signal.throwIfAborted();
      return value;
    } catch (cause) {
      if (
        !controller.signal.aborted &&
        (cause instanceof SyntaxError || cause instanceof TypeError)
      ) {
        throw new ApiError('Resposta inválida da API', { type: 'invalid-response', cause });
      }
      throw cause;
    }
  } catch (cause) {
    if (controller.signal.aborted) {
      if (timedOut) {
        throw new ApiError('Tempo de resposta da API esgotado', { type: 'timeout', cause });
      }
      throw new ApiError(
        signal?.reason instanceof Error ? signal.reason.message : 'Requisição cancelada',
        {
          type: 'canceled',
          cause,
        },
      );
    }
    if (cause instanceof ApiError) throw cause;
    if (cause instanceof TypeError)
      throw new ApiError('Não foi possível conectar à API', { type: 'network', cause });
    if (cause instanceof SyntaxError)
      throw new ApiError('Resposta inválida da API', { type: 'invalid-response', cause });
    throw cause;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * @template T
 * @param {Promise<unknown>} promise
 * @param {(value: unknown) => value is T} validator
 * @returns {Promise<T>}
 */
async function validateResponse(promise, validator) {
  const value = await promise;
  if (!validator(value))
    throw new ApiError('Resposta inválida da API', { type: 'invalid-response' });
  return value;
}

/** @param {unknown} credentials */
function managerCredentialsBody(credentials) {
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    throw new ApiError('Credenciais inválidas', { type: 'client' });
  }

  const payload = /** @type {Record<string, unknown>} */ (credentials);
  const { email, password } = payload;
  if (
    typeof email !== 'string' ||
    email.trim().length === 0 ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    throw new ApiError('Credenciais inválidas', { type: 'client' });
  }

  return { email, password };
}

function summaryPath(date, username = '') {
  if (!isIsoDate(date)) {
    throw new Error('Selecione uma data válida');
  }
  const query = new URLSearchParams({ date });
  if (username) query.set('username', username);
  return `/dashboard/summary?${query}`;
}

function exportPath(format, date, username = '') {
  if (!['csv', 'pdf'].includes(format)) throw new Error('Formato de exportação inválido');
  return summaryPath(date, username).replace('/summary?', `/export/${format}?`);
}

/** @type {import('./contracts').ApiClient} */
export const api = {
  users: (signal) => validateResponse(request('/users/', { signal }), validUsers),
  realtime: (signal) =>
    validateResponse(request('/activities/realtime', { signal }), validRealtime),
  summary: async (date, username = '', signal) =>
    validateResponse(request(summaryPath(date, username), { signal }), validSummary),
  settings: (signal) => validateResponse(request('/config/', { signal }), validSettings),
  saveSettings: (payload, signal) =>
    validateResponse(
      request('/config/', { method: 'PUT', body: JSON.stringify(payload), signal }),
      validSettings,
    ),
  registerManager: async (credentials, signal) =>
    validateResponse(
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(managerCredentialsBody(credentials)),
        signal,
        omitErrorDetails: true,
      }),
      validManager,
    ),
  loginManager: async (credentials, signal) =>
    validateResponse(
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(managerCredentialsBody(credentials)),
        signal,
        omitErrorDetails: true,
      }),
      validManagerToken,
    ),
  getCurrentManager: async (accessToken, signal) => {
    if (!validJwtAccessToken(accessToken)) {
      throw new ApiError('Token JWT inválido', { type: 'client' });
    }

    return validateResponse(
      request('/auth/me', {
        signal,
        headers: { Authorization: `Bearer ${accessToken}` },
        omitErrorDetails: true,
      }),
      validManager,
    );
  },
  async exportFile(format, date, username = '', signal) {
    return request(exportPath(format, date, username), { signal }, (response) => {
      const expectedType = format === 'csv' ? 'text/csv' : 'application/pdf';
      const contentType = response.headers?.get('content-type');
      if (!contentType || contentType.split(';')[0].trim().toLowerCase() !== expectedType) {
        throw new ApiError('Formato de resposta inválido', { type: 'invalid-response' });
      }
      return response.blob();
    });
  },
  login: async (credentials, signal) => {
    const res = await validateResponse(
      request('/auth/login', { method: 'POST', body: JSON.stringify(credentials), signal }),
      validAuthToken,
    );
    setStoredToken(res.access_token);
    return res;
  },
  register: (data, signal) =>
    validateResponse(
      request('/auth/register', { method: 'POST', body: JSON.stringify(data), signal }),
      validManagerProfile,
    ),
  me: (signal) => validateResponse(request('/auth/me', { signal }), validManagerProfile),
  tasks: (statusFilter, signal) =>
    validateResponse(
      request(statusFilter ? `/tasks/?status=${encodeURIComponent(statusFilter)}` : '/tasks/', {
        signal,
      }),
      validTasks,
    ),
  createTask: (payload, signal) =>
    validateResponse(
      request('/tasks/', { method: 'POST', body: JSON.stringify(payload), signal }),
      validTask,
    ),
  updateTask: (taskId, payload, signal) =>
    validateResponse(
      request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload), signal }),
      validTask,
    ),
  deleteTask: (taskId, signal) =>
    request(`/tasks/${taskId}`, { method: 'DELETE', signal }, () => Promise.resolve()),
  logout: () => setStoredToken(null),
  getToken: () => getStoredToken(),
};
