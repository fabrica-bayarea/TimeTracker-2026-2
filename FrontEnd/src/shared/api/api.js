import { isIsoDate } from '../lib/date';
import { notifyAuthenticationRequired, readManagerAccessToken } from '../auth/sessionStorage';
import {
  validManager,
  validManagerProfile,
  validManagerToken,
  validJwtAccessToken,
  validTask,
  validTaskCreatePayload,
  validTasks,
  validTaskUpdatePayload,
  validUuid,
  validRealtime,
  validSettings,
  validSummary,
  validUsers,
} from './validators';

/** @param {string | undefined} configuredUrl @param {boolean} isDevelopment @param {string} developmentUrl */
export function resolveApiBaseUrl(configuredUrl, isDevelopment, developmentUrl = '') {
  const configured = configuredUrl?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return isDevelopment ? developmentUrl : '';
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL,
  import.meta.env.DEV,
  import.meta.env.DEV ? 'http://localhost:8000' : '',
);
const TIMEOUT = 15000;

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

/** @param {number} status */
function httpErrorMessage(status) {
  const messages = {
    400: 'Os dados enviados são inválidos. Revise as informações e tente novamente.',
    401: 'Não foi possível autenticar. Confira seu e-mail e sua senha.',
    403: 'Você não tem permissão para realizar esta operação.',
    404: 'O recurso solicitado não foi encontrado.',
    409: 'Já existe um registro com esses dados. Revise as informações e tente novamente.',
    422: 'Confira os campos informados e tente novamente.',
    429: 'Muitas solicitações foram feitas. Aguarde um pouco e tente novamente.',
  };
  return (
    messages[status] ||
    (status >= 500
      ? 'O serviço está temporariamente indisponível. Tente novamente em instantes.'
      : 'Não foi possível concluir a solicitação. Revise as informações e tente novamente.')
  );
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
  return new ApiError(httpErrorMessage(response.status), {
    type: response.status >= 500 ? 'server' : 'client',
    status: response.status,
    statusText: response.statusText || '',
    detail,
  });
}

/**
 * @template T
 * @param {string} path
 * @param {RequestInit & { omitErrorDetails?: boolean, authenticated?: boolean }} [options]
 * @param {(response: Response) => Promise<T>} [read]
 * @returns {Promise<T>}
 */
async function request(
  path,
  { signal, omitErrorDetails = false, authenticated = false, ...options } = {},
  read = (response) => response.json(),
) {
  const accessToken = authenticated ? readManagerAccessToken() : null;
  if (authenticated && !accessToken) {
    notifyAuthenticationRequired();
    throw new ApiError('Sessão não autenticada', { type: 'client', status: 401 });
  }

  // O controller próprio permite timeout; timedOut o distingue do cancelamento externo.
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
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
    controller.signal.throwIfAborted();
    if (response.status === 401 && authenticated) notifyAuthenticationRequired();
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

/**
 * Performs an HTTP request with timeout, cancellation, and schema validation.
 * @template T
 * @param {string} path
 * @param {(value: unknown) => value is T} validator
 * @param {RequestInit & { omitErrorDetails?: boolean, authenticated?: boolean }} [options]
 * @returns {Promise<T>}
 */
export function requestValidated(path, validator, options = {}) {
  return validateResponse(request(path, options), validator);
}

/**
 * Performs a request whose successful response must not contain a body.
 * @param {string} path
 * @param {RequestInit & { omitErrorDetails?: boolean, authenticated?: boolean }} [options]
 * @returns {Promise<void>}
 */
export function requestNoContent(path, options = {}) {
  return request(path, options, async (response) => {
    if (response.status !== 204) {
      throw new ApiError('Resposta inválida da API', { type: 'invalid-response' });
    }
  });
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
  users: (signal) =>
    validateResponse(request('/users/', { signal, authenticated: true }), validUsers),
  realtime: (signal) =>
    validateResponse(
      request('/activities/realtime', { signal, authenticated: true }),
      validRealtime,
    ),
  summary: async (date, username = '', signal) =>
    validateResponse(
      request(summaryPath(date, username), { signal, authenticated: true }),
      validSummary,
    ),
  settings: (signal) =>
    validateResponse(request('/config/', { signal, authenticated: true }), validSettings),
  saveSettings: (payload, signal) =>
    validateResponse(
      request('/config/', {
        method: 'PUT',
        body: JSON.stringify(payload),
        signal,
        authenticated: true,
      }),
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
      validManagerProfile,
    );
  },
  getAssociationCode: async (signal) => {
    const manager = await validateResponse(
      request('/auth/me', { signal, authenticated: true, omitErrorDetails: true }),
      validManagerProfile,
    );
    return manager.association_code;
  },
  tasks: (signal) =>
    validateResponse(request('/tasks/', { signal, authenticated: true }), validTasks),
  getTask: async (taskId, signal) => {
    if (!validUuid(taskId)) throw new ApiError('ID de Task inválido', { type: 'client' });
    return validateResponse(
      request(`/tasks/${taskId}`, { signal, authenticated: true }),
      validTask,
    );
  },
  createTask: async (payload, signal) => {
    if (!validTaskCreatePayload(payload)) {
      throw new ApiError('Dados inválidos para criar a Task', { type: 'client' });
    }
    return validateResponse(
      request('/tasks/', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal,
        authenticated: true,
      }),
      validTask,
    );
  },
  updateTask: async (taskId, payload, signal) => {
    if (!validUuid(taskId)) throw new ApiError('ID de Task inválido', { type: 'client' });
    if (!validTaskUpdatePayload(payload)) {
      throw new ApiError('Dados inválidos para atualizar a Task', { type: 'client' });
    }
    return validateResponse(
      request(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        signal,
        authenticated: true,
      }),
      validTask,
    );
  },
  deleteTask: async (taskId, signal) => {
    if (!validUuid(taskId)) throw new ApiError('ID de Task inválido', { type: 'client' });
    return requestNoContent(`/tasks/${taskId}`, {
      method: 'DELETE',
      signal,
      authenticated: true,
    });
  },
  async exportFile(format, date, username = '', signal) {
    return request(
      exportPath(format, date, username),
      { signal, authenticated: true },
      (response) => {
        const expectedType = format === 'csv' ? 'text/csv' : 'application/pdf';
        const contentType = response.headers?.get('content-type');
        if (!contentType || contentType.split(';')[0].trim().toLowerCase() !== expectedType) {
          throw new ApiError('Formato de resposta inválido', { type: 'invalid-response' });
        }
        return response.blob();
      },
    );
  },
};
