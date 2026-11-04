import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import { MANAGER_ACCESS_TOKEN_KEY } from '../shared/auth/sessionStorage';

vi.mock('./layout/Sidebar', () => ({ Sidebar: () => null }));

const token = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;
const manager = {
  id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
  email: 'gestor@empresa.com',
  created_at: '2026-10-21T12:00:00Z',
  association_code: '001234',
};

function withSession(client = { getCurrentManager: vi.fn().mockResolvedValue(manager) }) {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  return client;
}

afterEach(() => {
  window.location.hash = '';
  sessionStorage.clear();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

it('restores the theme on direct entry to a protected route', async () => {
  localStorage.setItem('timetracker-theme', 'dark');
  window.location.hash = '#/tasks';
  render(<App authClient={withSession()} />);

  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(await screen.findByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
});

it('keeps protected content hidden while the saved session is being validated', async () => {
  let resolveManager;
  const client = withSession({
    getCurrentManager: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveManager = resolve;
        }),
    ),
  });
  window.location.hash = '#/tasks';
  render(<App authClient={client} />);

  expect(screen.getByRole('status')).toHaveTextContent('Validando a sessão');
  expect(screen.queryByRole('heading', { level: 1, name: 'Tasks' })).not.toBeInTheDocument();
  resolveManager(manager);
  expect(await screen.findByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
});

it('redirects an unauthenticated visitor from a protected route to login', async () => {
  window.location.hash = '#/tasks';
  render(<App authClient={{ getCurrentManager: vi.fn() }} />);

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Entrar no Dashboard' }),
  ).toBeInTheDocument();
  expect(window.location.hash).toBe('#/login');
  expect(screen.queryByRole('heading', { level: 1, name: 'Tasks' })).not.toBeInTheDocument();
});

it('clears an expired token rejected while restoring the protected route', async () => {
  sessionStorage.setItem(MANAGER_ACCESS_TOKEN_KEY, token);
  window.location.hash = '#/tasks';
  render(
    <App
      authClient={{
        getCurrentManager: vi.fn().mockRejectedValue({ status: 401, type: 'client' }),
      }}
    />,
  );

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Entrar no Dashboard' }),
  ).toBeInTheDocument();
  await waitFor(() => expect(window.location.hash).toBe('#/login'));
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});

it('skips to protected content without replacing the current hash route', async () => {
  window.location.hash = '#/tasks';
  render(<App authClient={withSession()} />);
  await screen.findByRole('heading', { level: 1, name: 'Tasks' });

  fireEvent.click(screen.getByRole('link', { name: 'Pular para o conteúdo principal' }));
  expect(window.location.hash).toBe('#/tasks');
  expect(screen.getByRole('main')).toHaveFocus();
});

it('shows a destination for an unknown route and updates the document title', () => {
  window.location.hash = '#/rota-inexistente';
  render(<App authClient={{ getCurrentManager: vi.fn() }} />);
  expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ir para o painel' })).toHaveAttribute(
    'href',
    '#/painel',
  );
  expect(document.title).toBe('Página não encontrada | TimeTrack');
});

it('returns to login and clears the session after a protected API responds 401', async () => {
  const client = withSession();
  window.location.hash = '#/tasks';
  const { rerender } = render(<App authClient={client} />);
  await screen.findByRole('heading', { level: 1, name: 'Tasks' });

  window.dispatchEvent(new Event('timetracker:auth-required'));
  await waitFor(() => expect(window.location.hash).toBe('#/login'));
  rerender(<App authClient={client} />);
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Entrar no Dashboard' }),
  ).toBeInTheDocument();
  expect(sessionStorage.getItem(MANAGER_ACCESS_TOKEN_KEY)).toBeNull();
});
