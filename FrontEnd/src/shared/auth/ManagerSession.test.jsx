import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ManagerSessionProvider, useManagerSession } from './ManagerSession';
import { MANAGER_ACCESS_TOKEN_KEY } from './sessionStorage';

const token = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;
const manager = {
  id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
  email: 'gestor@empresa.com',
  created_at: '2026-10-21T12:00:00Z',
  association_code: '001234',
};

function SessionControls() {
  const { status, manager: currentManager, login, logout, retrySession } = useManagerSession();
  return (
    <>
      <p role="status">{status}</p>
      <p aria-label="Gestor atual">{currentManager?.email || ''}</p>
      <button
        type="button"
        onClick={() =>
          void login({ email: 'gestor@empresa.com', password: 'senha' }).catch(() => {})
        }
      >
        Entrar
      </button>
      <button type="button" onClick={logout}>
        Sair
      </button>
      <button type="button" onClick={() => void retrySession()}>
        Tentar novamente
      </button>
    </>
  );
}

afterEach(() => {
  sessionStorage.clear();
  window.location.hash = '';
  vi.unstubAllGlobals();
});

it('restores the manager identity from the API and clears the session on logout', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = { getCurrentManager: vi.fn().mockResolvedValue(manager) };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('authenticated'));
  expect(client.getCurrentManager).toHaveBeenCalledWith(token, expect.any(AbortSignal));
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

  expect(screen.getByRole('status')).toHaveTextContent('anonymous');
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
  expect(window.location.hash).toBe('#/login');
});

it('removes a token rejected by the identity endpoint', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = {
    getCurrentManager: vi.fn().mockRejectedValue({ status: 401, type: 'client' }),
  };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'));
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});

it('keeps a stored session after a temporary network failure and allows retry', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = {
    getCurrentManager: vi
      .fn()
      .mockRejectedValueOnce({ type: 'network' })
      .mockResolvedValueOnce(manager),
  };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('unavailable'));
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBe(token);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('authenticated'));
  expect(screen.getByLabelText('Gestor atual')).toHaveTextContent(manager.email);
  expect(client.getCurrentManager).toHaveBeenCalledTimes(2);
});

it('clears a delayed identity response on logout and does not restore the old manager', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  let resolveManager;
  const client = {
    getCurrentManager: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveManager = resolve;
        }),
    ),
  };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(client.getCurrentManager).toHaveBeenCalledOnce());
  const signal = client.getCurrentManager.mock.calls[0][1];
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  resolveManager(manager);

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'));
  expect(signal.aborted).toBe(true);
  expect(screen.getByLabelText('Gestor atual')).toBeEmptyDOMElement();
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});

it('clears the previous manager before accepting a new identity', async () => {
  const nextToken = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyLWJpIn0.${'B'.repeat(43)}`;
  const nextManager = {
    ...manager,
    id: 'aa69c407-4b5e-40fd-8e67-c2206ef9fca4',
    email: 'novo@empresa.com',
  };
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  const client = {
    loginManager: vi.fn().mockResolvedValue({
      access_token: nextToken,
      token_type: 'bearer',
      expires_in: 3600,
    }),
    getCurrentManager: vi.fn().mockResolvedValueOnce(manager).mockResolvedValueOnce(nextManager),
  };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() =>
    expect(screen.getByLabelText('Gestor atual')).toHaveTextContent(manager.email),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(screen.getByLabelText('Gestor atual')).toBeEmptyDOMElement();
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Gestor atual')).toHaveTextContent(nextManager.email),
  );
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBe(nextToken);
});

it('clears a malformed stored token without calling the identity endpoint', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, 'not-a-jwt');
  const client = { getCurrentManager: vi.fn() };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'));
  expect(client.getCurrentManager).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});

it('cancels a pending login when the manager logs out', async () => {
  let resolveLogin;
  const client = {
    loginManager: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    ),
    getCurrentManager: vi.fn().mockResolvedValue(manager),
  };
  render(
    <ManagerSessionProvider client={client}>
      <SessionControls />
    </ManagerSessionProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() => expect(client.loginManager).toHaveBeenCalledOnce());
  const signal = client.loginManager.mock.calls[0][1];
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(signal).toBeInstanceOf(AbortSignal);
  expect(signal.aborted).toBe(true);

  resolveLogin({ access_token: token, token_type: 'bearer', expires_in: 3600 });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'));
  expect(client.getCurrentManager).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});
