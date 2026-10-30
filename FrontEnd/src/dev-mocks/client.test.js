import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devApi } from './client';
import { MANAGER_ACCESS_TOKEN_KEY } from '../shared/auth/sessionStorage';

const token = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;

beforeEach(() => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  sessionStorage.removeItem(MANAGER_ACCESS_TOKEN_KEY);
});

describe('cliente isolado dos mocks de desenvolvimento', () => {
  it('lista Tasks pela rota proposta e valida a resposta', async () => {
    const response = [];
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(devApi.tasks()).resolves.toEqual(response);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/tasks/');
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('cria Task com descrição opcional e zero ou mais colaboradores', async () => {
    const task = {
      id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      title: 'Relatório mensal',
      description: 'Revisar relatório',
      collaborators: [
        {
          id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
          username: 'ana',
          full_name: 'Ana Souza',
        },
      ],
      created_at: '2026-10-13T14:20:00Z',
      updated_at: '2026-10-13T14:20:00Z',
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => task }));
    vi.stubGlobal('fetch', fetchMock);
    const payload = {
      title: ' Relatório mensal ',
      description: ' Revisar relatório ',
      collaborator_ids: [task.collaborators[0].id],
    };
    await expect(devApi.createTask(payload)).resolves.toEqual(task);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/tasks/');
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(fetchMock.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
    expect(() => devApi.createTask({ ...payload, title: ' ' })).toThrow('válidos');
    const unassignedTask = { ...task, description: null, collaborators: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => unassignedTask })),
    );
    await expect(
      devApi.createTask({ title: 'Task sem atribuição', collaborator_ids: [] }),
    ).resolves.toEqual(unassignedTask);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1].body)).toEqual({
      title: 'Task sem atribuição',
      collaborator_ids: [],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ detail: 'Invalid task payload' }),
      })),
    );
    await expect(devApi.createTask(payload)).rejects.toMatchObject({
      type: 'client',
      status: 422,
      message: 'Confira os campos informados e tente novamente.',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    await expect(devApi.createTask(payload)).rejects.toMatchObject({ type: 'invalid-response' });
    await expect(devApi.tasks()).rejects.toThrow('Resposta inválida');
  });

  it('carrega colaboradores e envia atualizações/exclusões pela API de desenvolvimento', async () => {
    const collaborator = {
      id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
      username: 'ana',
      full_name: 'Ana Souza',
    };
    const task = {
      id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      title: 'Relatório mensal',
      description: 'Revisar relatório',
      collaborators: [collaborator],
      created_at: '2026-10-13T14:20:00Z',
      updated_at: '2026-10-13T14:20:00Z',
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [collaborator] }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(devApi.collaborators()).resolves.toEqual([collaborator]);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/users/');

    const mutationMock = vi.fn(async (_url, options) =>
      options.method === 'DELETE'
        ? { ok: true, status: 204 }
        : { ok: true, json: async () => task },
    );
    vi.stubGlobal('fetch', mutationMock);
    await expect(
      devApi.updateTask(task.id, {
        title: task.title,
        description: task.description,
        collaborator_ids: [collaborator.id],
      }),
    ).resolves.toEqual(task);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'PUT' });

    await expect(devApi.deleteTask(task.id)).resolves.toBeUndefined();
    expect(mutationMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });

  it('consulta resumo demonstrativo por data, colaborador e Task', async () => {
    const response = { date: '2026-10-13', timezone: 'America/Sao_Paulo', tasks: [] };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      devApi.taskSummary('2026-10-13', 'ana', '6e7b94da-5651-46a0-bf28-fcb8f4f14c04'),
    ).resolves.toEqual(response);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/dashboard/tasks-summary');
    expect(url.searchParams.get('date')).toBe('2026-10-13');
    expect(url.searchParams.get('username')).toBe('ana');
    expect(url.searchParams.get('task_id')).toBe('6e7b94da-5651-46a0-bf28-fcb8f4f14c04');
    expect(() => devApi.taskSummary('2026-02-31')).toThrow('data válida');
  });

  it('consulta jornada e codifica username no filtro', async () => {
    const attendance = {
      date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      as_of: '2026-10-13T19:50:00Z',
      users: [],
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => attendance }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(devApi.attendance('2026-10-13', 'ana & joão')).resolves.toEqual(attendance);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/dashboard/attendance');
    expect(url.searchParams.get('username')).toBe('ana & joão');
  });

  it('envia o período de horas e trata falhas HTTP sem converter em vazio', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'Consulta indisponível' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(devApi.taskHours('2026-10-01', '2026-10-13')).rejects.toThrow(
      'O serviço está temporariamente indisponível. Tente novamente em instantes.',
    );
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/dashboard/task-hours');
    expect(() => devApi.taskHours('2026-10-13', '2026-10-01')).toThrow('período válido');
  });

  it('consulta status do Agent em rota separada', async () => {
    const response = { agents: [] };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(devApi.agentStatuses()).resolves.toEqual(response);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/agents/status');
  });

  it('normalizes network failures, invalid JSON, and HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => {
          throw new SyntaxError('invalid json');
        },
      })),
    );
    await expect(devApi.tasks()).rejects.toMatchObject({ type: 'invalid-response' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(devApi.tasks()).rejects.toMatchObject({ type: 'network' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        statusText: 'Unavailable',
        json: async () => {
          throw new SyntaxError('empty response');
        },
      })),
    );
    await expect(devApi.tasks()).rejects.toMatchObject({ type: 'server', status: 503 });
  });

  it('honors AbortSignal cancellation before sending a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(devApi.tasks(controller.signal)).rejects.toMatchObject({ type: 'canceled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies the shared request timeout to mock API calls', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const pending = devApi.tasks();
    const rejection = expect(pending).rejects.toMatchObject({ type: 'timeout' });
    await vi.advanceTimersByTimeAsync(15000);
    await rejection;
  });
});
