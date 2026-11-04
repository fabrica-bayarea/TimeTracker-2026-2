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
  const { status, login, logout } = useManagerSession();
  return (
    <>
      <p role="status">{status}</p>
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
