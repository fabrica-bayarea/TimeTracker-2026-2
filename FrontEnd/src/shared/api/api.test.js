import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, resolveApiBaseUrl } from './api';
import { MANAGER_ACCESS_TOKEN_KEY } from '../auth/sessionStorage';

const ACCESS_TOKEN = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;

beforeEach(() => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, ACCESS_TOKEN);
});

afterEach(() => {
  sessionStorage.removeItem(MANAGER_ACCESS_TOKEN_KEY);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('mensagens HTTP seguras', () => {
  it.each([
    [400, 'Os dados enviados são inválidos. Revise as informações e tente novamente.'],
    [401, 'Não foi possível autenticar. Confira seu e-mail e sua senha.'],
    [403, 'Você não tem permissão para realizar esta operação.'],
    [404, 'O recurso solicitado não foi encontrado.'],
    [409, 'Já existe um registro com esses dados. Revise as informações e tente novamente.'],
    [422, 'Confira os campos informados e tente novamente.'],
    [429, 'Muitas solicitações foram feitas. Aguarde um pouco e tente novamente.'],
    [500, 'O serviço está temporariamente indisponível. Tente novamente em instantes.'],
    [503, 'O serviço está temporariamente indisponível. Tente novamente em instantes.'],
  ])('HTTP %i não expõe o detalhe do servidor', async (status, message) => {
    const secret = 'internal traceback, bearer eyJhbGciOi...';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status,
        json: async () => ({ detail: secret }),
      })),
    );

    const error = await api.users().catch((cause) => cause);
    expect(error).toMatchObject({ status, message });
    expect(error.message).not.toContain(secret);
  });
});

describe('cliente da API', () => {
  it('usa localhost como padrão apenas no desenvolvimento', () => {
    expect(resolveApiBaseUrl(undefined, true, 'http://localhost:8000')).toBe(
      'http://localhost:8000',
    );
    expect(resolveApiBaseUrl(undefined, false)).toBe('');
  });

  it('preserva a origem configurada e remove barras finais', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/// ', false)).toBe(
      'https://api.example.com',
    );
    expect(resolveApiBaseUrl('/api/', false)).toBe('/api');
  });

  it('registers a manager using the ManagerOut contract', async () => {
    const manager = {
      id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
      email: 'gestor@empresa.com',
      created_at: '2026-10-13T12:00:00Z',
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => manager }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api.registerManager({ email: manager.email, password: 'SenhaSegura123!', role: 'admin' }),
    ).resolves.toEqual(manager);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/auth/register');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(fetchMock.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: manager.email,
      password: 'SenhaSegura123!',
    });
  });

  it('logs in with the server-issued bearer token and expiry in seconds', async () => {
    const response = {
      access_token: ACCESS_TOKEN,
      token_type: 'bearer',
      expires_in: 3600,
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api.loginManager({ email: 'gestor@empresa.com', password: 'SenhaSegura123!' }),
    ).resolves.toEqual(response);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/auth/login');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: 'gestor@empresa.com',
      password: 'SenhaSegura123!',
    });
  });

  it('gets the current manager using the caller-provided in-memory bearer token', async () => {
    const token = ACCESS_TOKEN;
    const manager = {
      id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
      email: 'gestor@empresa.com',
      created_at: '2026-10-13T12:00:00Z',
      association_code: '001234',
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => manager }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getCurrentManager(token)).resolves.toEqual(manager);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/auth/me');
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('reads the six-digit association code from the authenticated manager profile', async () => {
    const manager = {
      id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
      email: 'gestor@empresa.com',
      created_at: '2026-10-30T12:00:00Z',
      association_code: '001234',
    };
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => manager }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getAssociationCode()).resolves.toBe('001234');
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/auth/me');
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it('integra o CRUD autenticado de Tasks e aceita DELETE 204 sem tentar ler JSON', async () => {
    const taskId = '6e7b94da-5651-46a0-bf28-fcb8f4f14c04';
    const task = {
      id: taskId,
      title: 'Planejar sprint',
      description: null,
      collaborators: [],
      created_at: '2026-10-30T12:00:00',
      updated_at: '2026-10-30T12:00:00',
    };
    const fetchMock = vi.fn(async (url, options) => {
      const method = options.method || 'GET';
      if (method === 'DELETE') return { ok: true, status: 204 };
      if (method === 'PUT') {
        return { ok: true, status: 200, json: async () => ({ ...task, title: 'Sprint' }) };
      }
      if (method === 'POST') return { ok: true, status: 201, json: async () => task };
      if (method === 'GET' && url.endsWith('/tasks/')) {
        return { ok: true, status: 200, json: async () => [task] };
      }
      return { ok: true, status: 200, json: async () => task };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.tasks()).resolves.toEqual([task]);
    await expect(api.getTask(taskId)).resolves.toEqual(task);
    await expect(
      api.createTask({ title: 'Planejar sprint', description: null, collaborator_ids: [] }),
    ).resolves.toEqual(task);
    await expect(api.updateTask(taskId, { title: 'Sprint' })).resolves.toEqual({
      ...task,
      title: 'Sprint',
    });
    await expect(api.deleteTask(taskId)).resolves.toBeUndefined();

    expect(fetchMock.mock.calls.map(([, options]) => options.method || 'GET')).toEqual([
      'GET',
      'GET',
      'POST',
      'PUT',
      'DELETE',
    ]);
    expect(fetchMock.mock.calls.map(([, options]) => options.headers.get('Authorization'))).toEqual(
      Array(5).fill(`Bearer ${ACCESS_TOKEN}`),
    );
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      title: 'Planejar sprint',
      description: null,
      collaborator_ids: [],
    });
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ title: 'Sprint' });
  });

  it('rejeita IDs e payloads de Task inválidos antes de enviar a requisição', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getTask('bad-id')).rejects.toMatchObject({ type: 'client' });
    await expect(api.updateTask('bad-id', { title: 'A' })).rejects.toMatchObject({
      type: 'client',
    });
    await expect(api.deleteTask('bad-id')).rejects.toMatchObject({ type: 'client' });
    await expect(api.createTask({ title: 'x'.repeat(201) })).rejects.toMatchObject({
      type: 'client',
    });
    await expect(api.updateTask('6e7b94da-5651-46a0-bf28-fcb8f4f14c04', {})).rejects.toMatchObject({
      type: 'client',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserva erros HTTP de Tasks e rejeita sucesso DELETE que não seja 204', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Task não encontrada' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.deleteTask('6e7b94da-5651-46a0-bf28-fcb8f4f14c04')).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.deleteTask('6e7b94da-5651-46a0-bf28-fcb8f4f14c04')).rejects.toMatchObject({
      type: 'invalid-response',
    });
  });

  it('adds the session bearer to private data requests but not to public authentication', async () => {
    sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, ACCESS_TOKEN);
    const fetchMock = vi.fn(async (url) => ({
      ok: true,
      json: async () =>
        new URL(url).pathname === '/auth/login'
          ? { access_token: ACCESS_TOKEN, token_type: 'bearer', expires_in: 3600 }
          : [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.users();
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);

    await api.loginManager({ email: 'gestor@empresa.com', password: 'SenhaSegura123!' });
    expect(fetchMock.mock.calls[1][1].headers.has('Authorization')).toBe(false);
  });

  it('rejects private requests without a session and coordinates logout after HTTP 401', async () => {
    sessionStorage.removeItem(MANAGER_ACCESS_TOKEN_KEY);
    const onUnauthorized = vi.fn();
    window.addEventListener('timetracker:auth-required', onUnauthorized);
    const fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.users()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();

    sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, ACCESS_TOKEN);
    await expect(api.users()).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(2);
    window.removeEventListener('timetracker:auth-required', onUnauthorized);
  });

  it('preserves HTTP 403 without clearing or expiring the session', async () => {
    sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, ACCESS_TOKEN);
    const onUnauthorized = vi.fn();
    window.addEventListener('timetracker:auth-required', onUnauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })),
    );

    await expect(api.users()).rejects.toMatchObject({ status: 403 });
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBe(ACCESS_TOKEN);
    window.removeEventListener('timetracker:auth-required', onUnauthorized);
  });

  it('preserves duplicate-email status without exposing server-provided auth details', async () => {
    const json = vi.fn(async () => ({ detail: 'E-mail gestor@empresa.com já cadastrado' }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 409, json })),
    );

    const failure = await api
      .registerManager({ email: 'gestor@empresa.com', password: 'SenhaSegura123!' })
      .catch((error) => error);
    expect(failure).toMatchObject({ type: 'client', status: 409, detail: null });
    expect(failure.message).toBe(
      'Já existe um registro com esses dados. Revise as informações e tente novamente.',
    );
    expect(json).not.toHaveBeenCalled();
  });

  it('preserves invalid registration payload status without echoing request values', async () => {
    const json = vi.fn(async () => ({ detail: 'Senha inválida: SenhaFraca!' }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 422, json })),
    );

    const failure = await api
      .registerManager({ email: 'inválido', password: 'SenhaFraca!' })
      .catch((error) => error);
    expect(failure).toMatchObject({ type: 'client', status: 422, detail: null });
    expect(failure.message).toBe('Confira os campos informados e tente novamente.');
    expect(json).not.toHaveBeenCalled();
  });

  it('handles invalid login credentials as HTTP 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401, json: vi.fn() })),
    );

    await expect(
      api.loginManager({ email: 'gestor@empresa.com', password: 'senha-incorreta' }),
    ).rejects.toMatchObject({ type: 'client', status: 401, detail: null });
  });

  it('supports AbortSignal for authenticated API calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(api.getCurrentManager(ACCESS_TOKEN, controller.signal)).rejects.toMatchObject({
      type: 'canceled',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose a bearer token or reflected server details on auth errors', async () => {
    const token = `eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJwcm92YWRvIn0.${'A'.repeat(43)}`;
    const json = vi.fn(async () => ({ detail: `Token invalido: ${token}` }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401, json })),
    );

    const failure = await api.getCurrentManager(token).catch((error) => error);
    expect(failure).toMatchObject({ type: 'client', status: 401, detail: null });
    expect(failure.message).not.toContain(token);
    expect(failure.cause).toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('rejects invalid token responses without reproducing the token', async () => {
    const token = ACCESS_TOKEN;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: token, token_type: 'invalid', expires_in: 3600 }),
      })),
    );

    const failure = await api
      .loginManager({ email: 'gestor@empresa.com', password: 'senha' })
      .catch((error) => error);
    expect(failure).toMatchObject({ type: 'invalid-response' });
    expect(failure.message).not.toContain(token);
  });

  it('rejects invalid JWT arguments before fetch without echoing the supplied value', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const invalidTokens = [
      '',
      null,
      undefined,
      42,
      'header.payload',
      'header..signature',
      ' header.payload.signature',
      'header.payload.signature ',
      'header.payload.signature\r\nX-Injected: yes',
      'a.b.c',
    ];

    for (const token of invalidTokens) {
      await expect(api.getCurrentManager(token)).rejects.toMatchObject({
        type: 'client',
        status: null,
        message: 'Token JWT inválido',
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed credential payloads before fetch without echoing values', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const invalidPayloads = [
      null,
      [],
      {},
      { email: '   ', password: 'senha' },
      { email: 'gestor@empresa.com', password: '' },
      { email: 'gestor@empresa.com', password: 123 },
    ];

    for (const authCall of [api.registerManager, api.loginManager]) {
      for (const payload of invalidPayloads) {
        await expect(authCall(payload)).rejects.toMatchObject({
          type: 'client',
          status: null,
          message: 'Credenciais inválidas',
        });
      }
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('não envia uma consulta cujo sinal já foi cancelado, mesmo com motivo timeout', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort('timeout');
    await expect(api.users(controller.signal)).rejects.toMatchObject({ type: 'canceled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('descarta leitura concluída depois do cancelamento externo', async () => {
    let finish;
    const controller = new AbortController();
    const json = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json })),
    );
    const pending = expect(api.users(controller.signal)).rejects.toMatchObject({
      type: 'canceled',
    });
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    controller.abort();
    finish([]);
    await pending;
  });

  it('rejeita um tipo MIME com sufixo enganoso', async () => {
    const blob = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => 'text/csv-invalid' },
        blob,
      })),
    );
    await expect(api.exportFile('csv', '2026-09-25')).rejects.toMatchObject({
      type: 'invalid-response',
    });
    expect(blob).not.toHaveBeenCalled();
  });
  it('rejeita exportação sem tipo MIME declarado', async () => {
    const blob = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, headers: { get: () => null }, blob })),
    );
    await expect(api.exportFile('csv', '2026-09-25')).rejects.toMatchObject({
      type: 'invalid-response',
    });
    expect(blob).not.toHaveBeenCalled();
  });
  it('codifica o usuário no filtro do resumo', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ date: '2026-09-25', users: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    await api.summary('2026-09-25', 'ana & joão');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/dashboard/summary');
    expect(url.searchParams.get('username')).toBe('ana & joão');
    expect(url.searchParams.get('date')).toBe('2026-09-25');
  });

  it('informa erro HTTP sem ler o corpo da resposta', async () => {
    const json = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403, json })),
    );
    await expect(api.users()).rejects.toThrow(
      'Você não tem permissão para realizar esta operação.',
    );
    expect(json).toHaveBeenCalledOnce();
  });

  it.each([400, 401, 403, 404, 500])(
    'preserva o status HTTP %i em consultas de dados',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: false, status, statusText: 'Erro', json: async () => ({}) })),
      );

      await expect(api.users()).rejects.toMatchObject({
        type: status >= 500 ? 'server' : 'client',
        status,
      });
    },
  );

  it('preserva status e detail do FastAPI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Regra não encontrada' }),
      })),
    );
    await expect(api.users()).rejects.toMatchObject({
      name: 'ApiError',
      type: 'client',
      status: 404,
      statusText: 'Not Found',
      detail: 'Regra não encontrada',
      message: 'O recurso solicitado não foi encontrado.',
    });
  });

  it('identifica validação, erro de servidor, rede e JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 422,
        json: async () => ({ detail: [{ msg: 'valor inválido' }] }),
      })),
    );
    await expect(api.users()).rejects.toMatchObject({
      type: 'client',
      message: 'Confira os campos informados e tente novamente.',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    await expect(api.users()).rejects.toMatchObject({ type: 'server', status: 503 });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(api.users()).rejects.toMatchObject({
      type: 'network',
      message: 'Não foi possível conectar à API',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => {
          throw new SyntaxError('JSON');
        },
      })),
    );
    await expect(api.users()).rejects.toMatchObject({ type: 'invalid-response' });
  });

  it('cancela uma consulta ao receber um sinal externo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          }),
      ),
    );
    const controller = new AbortController();
    const pending = expect(api.users(controller.signal)).rejects.toMatchObject({
      type: 'canceled',
      message: 'Consulta substituída',
    });
    controller.abort(new Error('Consulta substituída'));
    await pending;
  });

  it('mantém timeout ativo até terminar de ler o corpo', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, { signal }) => ({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          }),
      })),
    );
    const pending = expect(api.users()).rejects.toMatchObject({
      type: 'timeout',
      message: 'Tempo de resposta da API esgotado',
    });
    await vi.advanceTimersByTimeAsync(15000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('baixa apenas formatos CSV e PDF', async () => {
    const blob = new Blob(['dados'], { type: 'text/csv' });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'text/csv; charset=utf-8' },
      blob: async () => blob,
    }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await api.exportFile('csv', '2026-09-25')).toBe(blob);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/dashboard/export/csv');
    await expect(api.exportFile('html', '2026-09-25')).rejects.toThrow('Formato');
  });

  it('rejects invalid dates before sending a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.summary('2026-02-31')).rejects.toThrow('data válida');
    await expect(api.exportFile('csv', '')).rejects.toThrow('data válida');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an HTML response in place of a CSV export', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => 'text/html; charset=utf-8' },
        blob: vi.fn(),
      })),
    );
    await expect(api.exportFile('csv', '2026-09-25')).rejects.toThrow(
      'Formato de resposta inválido',
    );
  });

  it('valida os contratos JSON na camada da API', async () => {
    const payloads = [
      { call: () => api.users(), value: [{ username: 'ana', full_name: {} }] },
      {
        call: () => api.realtime(),
        value: [{ username: 'ana', status: 'online', seconds_since_last_activity: -1 }],
      },
      { call: () => api.summary('2026-09-25'), value: { date: '2026-09-25', users: [null] } },
      {
        call: () => api.settings(),
        value: { capture_interval_seconds: 0, idle_timeout_seconds: 300 },
      },
      {
        call: () => api.saveSettings({ capture_interval_seconds: 10, idle_timeout_seconds: 300 }),
        value: {},
      },
    ];
    for (const { call, value } of payloads) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: true, json: async () => value })),
      );
      await expect(call()).rejects.toMatchObject({ type: 'invalid-response' });
    }
  });

  it('aceita offline em uma resposta realtime válida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { username: 'ana', status: 'offline', seconds_since_last_activity: 901 },
        ],
      })),
    );

    await expect(api.realtime()).resolves.toEqual([
      { username: 'ana', status: 'offline', seconds_since_last_activity: 901 },
    ]);
  });
});
