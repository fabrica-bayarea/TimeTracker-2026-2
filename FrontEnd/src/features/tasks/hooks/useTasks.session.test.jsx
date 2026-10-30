import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../../../shared/api/api';
import { ManagerSessionProvider, useManagerSession } from '../../../shared/auth/ManagerSession';
import { MANAGER_ACCESS_TOKEN_KEY } from '../../../shared/auth/sessionStorage';
import { useTasks } from './useTasks';

const token = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;
const secondToken = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyMiJ9.${'B'.repeat(43)}`;
const manager = {
  id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
  email: 'gestor@empresa.com',
  created_at: '2026-10-21T12:00:00Z',
  association_code: '001234',
};
const secondManager = {
  ...manager,
  id: 'a249b314-31ba-49aa-8ca8-2ac5a9ea84c1',
  email: 'outro-gestor@empresa.com',
  association_code: '009876',
};
const previousSessionTask = {
  id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  title: 'Task da sessão anterior',
  description: null,
  collaborators: [],
  created_at: '2026-10-30T12:00:00Z',
  updated_at: '2026-10-30T12:00:00Z',
};
const currentSessionTask = {
  ...previousSessionTask,
  id: '7e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  title: 'Task da sessão atual',
};

function SessionTaskWorkspace({ taskService, showMutations = false }) {
  const { status, manager: currentManager, login, logout } = useManagerSession();

  return (
    <>
      <p role="status">
        {status}:{currentManager?.id || ''}
      </p>
      <button type="button" onClick={logout}>
        Sair
      </button>
      <button
        type="button"
        onClick={() =>
          void login({ email: secondManager.email, password: 'senha' }).catch(() => {})
        }
      >
        Entrar com outro gestor
      </button>
      {status === 'authenticated' && (
        <AuthenticatedTasks taskService={taskService} showMutations={showMutations} />
      )}
    </>
  );
}

function AuthenticatedTasks({ taskService, showMutations }) {
  const { tasks, createTask, updateTask, deleteTask } = useTasks(taskService);

  return (
    <section aria-label="Tasks da sessão">
      {tasks.map((task) => (
        <p key={task.id}>{task.title}</p>
      ))}
      <button
        type="button"
        onClick={() =>
          void createTask({ title: 'Task pendente', description: null, collaborator_ids: [] })
        }
      >
        Criar Task pendente
      </button>
      {showMutations && (
        <>
          <button
            type="button"
            onClick={() => void updateTask(previousSessionTask.id, { title: 'Task editada' })}
          >
            Editar Task pendente
          </button>
          <button type="button" onClick={() => void deleteTask(previousSessionTask.id)}>
            Excluir Task pendente
          </button>
        </>
      )}
    </section>
  );
}

afterEach(() => {
  sessionStorage.clear();
  window.location.hash = '';
  vi.unstubAllGlobals();
});

it('cancels pending task work at logout and ignores old-session replies after a manager switch', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = {
    getCurrentManager: vi.fn(async (accessToken) =>
      accessToken === token ? manager : secondManager,
    ),
    loginManager: vi.fn().mockResolvedValue({
      access_token: secondToken,
      token_type: 'bearer',
      expires_in: 3600,
    }),
  };
  let finishOldList;
  let finishOldCreate;
  let oldListSignal;
  let oldMutationSignal;
  let listCalls = 0;
  const taskService = {
    tasks: vi.fn((signal) => {
      listCalls += 1;
      if (listCalls === 1) {
        oldListSignal = signal;
        return new Promise((resolve) => {
          finishOldList = resolve;
        });
      }
      return Promise.resolve([currentSessionTask]);
    }),
    createTask: vi.fn((_payload, signal) => {
      oldMutationSignal = signal;
      return new Promise((resolve) => {
        finishOldCreate = resolve;
      });
    }),
  };

  render(
    <ManagerSessionProvider client={client}>
      <SessionTaskWorkspace taskService={taskService} />
    </ManagerSessionProvider>,
  );

  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(`authenticated:${manager.id}`),
  );
  await waitFor(() => expect(finishOldList).toBeTypeOf('function'));
  fireEvent.click(screen.getByRole('button', { name: 'Criar Task pendente' }));
  await waitFor(() => expect(finishOldCreate).toBeTypeOf('function'));

  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(oldListSignal.aborted).toBe(true);
  expect(oldMutationSignal.aborted).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('anonymous:');

  fireEvent.click(screen.getByRole('button', { name: 'Entrar com outro gestor' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(`authenticated:${secondManager.id}`),
  );
  expect(await screen.findByText('Task da sessão atual')).toBeVisible();

  await act(async () => {
    finishOldList([previousSessionTask]);
    finishOldCreate(previousSessionTask);
  });

  expect(screen.queryByText('Task da sessão anterior')).not.toBeInTheDocument();
  expect(screen.getByText('Task da sessão atual')).toBeVisible();
  expect(taskService.tasks).toHaveBeenCalledTimes(2);
});

it('clears the manager session when an authenticated Task request receives 401', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = { getCurrentManager: vi.fn().mockResolvedValue(manager) };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    json: async () => ({ detail: 'Token expirado' }),
  });
  vi.stubGlobal('fetch', fetchMock);

  render(
    <ManagerSessionProvider client={client}>
      <SessionTaskWorkspace taskService={api} />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous:'));
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
  expect(screen.queryByRole('region', { name: 'Tasks da sessão' })).not.toBeInTheDocument();
});

it.each(['create', 'update', 'delete'])(
  'clears the manager session when a Task %s request receives 401',
  async (operation) => {
    sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
    const client = { getCurrentManager: vi.fn().mockResolvedValue(manager) };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Token expirado' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const taskService = {
      ...api,
      tasks: vi.fn().mockResolvedValue([previousSessionTask]),
    };

    render(
      <ManagerSessionProvider client={client}>
        <SessionTaskWorkspace taskService={taskService} showMutations />
      </ManagerSessionProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(`authenticated:${manager.id}`),
    );
    expect(await screen.findByText('Task da sessão anterior')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', {
        name:
          operation === 'create'
            ? 'Criar Task pendente'
            : operation === 'update'
              ? 'Editar Task pendente'
              : 'Excluir Task pendente',
      }),
    );

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous:'));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
    expect(screen.queryByRole('region', { name: 'Tasks da sessão' })).not.toBeInTheDocument();
  },
);
