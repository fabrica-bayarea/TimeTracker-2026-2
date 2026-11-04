import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { api } from '../shared/api/api';
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';

vi.mock('../shared/api/api', () => ({
  api: {
    summary: vi.fn(),
    tasks: vi.fn(),
    users: vi.fn(),
    realtime: vi.fn(),
    settings: vi.fn(),
    saveSettings: vi.fn(),
    exportFile: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.tasks.mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

describe('estados de integração', () => {
  it('não mostra zero de usuários online quando o realtime falha', async () => {
    api.summary.mockImplementation(async (date) => ({ date, users: [] }));
    api.users.mockResolvedValue([{ username: 'ana', full_name: 'Ana' }]);
    api.realtime.mockRejectedValue(new Error('offline'));
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} manager={{ id: 'manager-1' }} />);
    await screen.findByRole('alert');
    expect(screen.getByText('Online').closest('article')).toHaveTextContent('—');
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('0h 00min');
  });

  it('ignora uma resposta antiga após mudar a data', async () => {
    let finishOld;
    api.summary.mockImplementation((date) =>
      date === '2026-09-24'
        ? new Promise((resolve) => {
            finishOld = resolve;
          })
        : Promise.resolve({ date, users: [] }),
    );
    api.users.mockResolvedValue([]);
    api.realtime.mockResolvedValue([]);
    const { result, rerender } = renderHook(({ date }) => useDashboardData(date, ''), {
      initialProps: { date: '2026-09-24' },
    });
    rerender({ date: '2026-09-25' });
    await waitFor(() => expect(result.current.data?.summary?.date).toBe('2026-09-25'));
    await act(async () => finishOld({ date: '2026-09-24', users: [] }));
    expect(result.current.data.summary.date).toBe('2026-09-25');
  });

  it('marca um resumo malformado como indisponível sem quebrar o painel', async () => {
    api.summary.mockRejectedValue(new Error('Resposta inválida da API'));
    api.users.mockResolvedValue([]);
    api.realtime.mockResolvedValue([]);
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} manager={{ id: 'manager-1' }} />);
    await screen.findByRole('alert');
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('—');
  });

  it('não permite salvar configurações que não foram lidas', async () => {
    api.settings.mockRejectedValue(new Error('API respondeu 503'));
    render(<SettingsPage />);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Salvar configurações' })).not.toBeInTheDocument();
    expect(api.saveSettings).not.toHaveBeenCalled();
  });

  it('rejects an invalid settings response after saving', async () => {
    api.settings.mockResolvedValue({ capture_interval_seconds: 10, idle_timeout_seconds: 300 });
    api.saveSettings.mockRejectedValue(new Error('Resposta inválida da API'));
    render(<SettingsPage />);
    fireEvent.change(await screen.findByLabelText('Intervalo de captura (segundos)'), {
      target: { value: '20' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar configurações' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Resposta inválida da API'),
    );
    expect(screen.queryByText('Configurações salvas.')).not.toBeInTheDocument();
  });

  it('cancels a settings save when leaving the page', async () => {
    api.settings.mockResolvedValue({ capture_interval_seconds: 10, idle_timeout_seconds: 300 });
    api.saveSettings.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<SettingsPage />);
    fireEvent.change(await screen.findByLabelText('Intervalo de captura (segundos)'), {
      target: { value: '20' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar configurações' }));
    const signal = api.saveSettings.mock.calls[0][1];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('exibe erro HTTP na exportação em vez de abrir uma aba vazia', async () => {
    api.users.mockResolvedValue([]);
    api.exportFile.mockRejectedValue(new Error('API respondeu 500'));
    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('API respondeu 500'));
  });

  it('cancels an export when leaving the page', async () => {
    api.users.mockResolvedValue([]);
    api.exportFile.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<ReportsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }));
    const signal = api.exportFile.mock.calls[0][3];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
