import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardData } from './useDashboardData';
import { api } from '../../../shared/api/api';

vi.mock('../../../shared/api/api', () => ({
  api: { summary: vi.fn(), users: vi.fn(), realtime: vi.fn() },
}));

const summary = { date: '2026-09-25', users: [] };
beforeEach(() => {
  vi.clearAllMocks();
  api.summary.mockResolvedValue(summary);
  api.users.mockResolvedValue([]);
  api.realtime.mockResolvedValue([]);
});

describe('useDashboardData', () => {
  it('não consulta nem conserva dados sem a sessão do gestor', async () => {
    const { result } = renderHook(() => useDashboardData('2026-09-25', '', '', false));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(api.summary).not.toHaveBeenCalled();
    expect(api.users).not.toHaveBeenCalled();
    expect(api.realtime).not.toHaveBeenCalled();
  });

  it('não apresenta o resumo de outro usuário como se correspondesse ao filtro', async () => {
    api.summary.mockResolvedValue({
      date: '2026-09-25',
      users: [{ username: 'bia', total_seconds: 60, by_category: [] }],
    });
    const { result } = renderHook(() => useDashboardData('2026-09-25', 'ana'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.summary).toBeNull();
    expect(result.current.error).toContain('Resumo: resposta inválida');
  });

  it('limpa o horário quando todas as fontes falham e os dados são removidos', async () => {
    const { result } = renderHook(() => useDashboardData('2026-09-25', ''));
    await waitFor(() => expect(result.current.updatedAt).toBeInstanceOf(Date));
    api.summary.mockRejectedValue(new Error('offline'));
    api.users.mockRejectedValue(new Error('offline'));
    api.realtime.mockRejectedValue(new Error('offline'));
    await act(async () => result.current.refresh());
    expect(result.current.updatedAt).toBeNull();
    expect(result.current.data.availability).toEqual({
      summary: false,
      users: false,
      realtime: false,
    });
  });
  it('carrega as três fontes e registra a atualização', async () => {
    const { result } = renderHook(() => useDashboardData('2026-09-25', ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.availability).toEqual({
      summary: true,
      users: true,
      realtime: true,
    });
    expect(result.current.updatedAt).toBeInstanceOf(Date);
  });

  it('descarta os dados e a resposta pendente ao trocar o escopo da sessão', async () => {
    let finishOldSummary;
    let oldSignal;
    const newSummary = {
      date: '2026-09-25',
      users: [{ username: 'bia', total_seconds: 20, by_category: [] }],
    };
    api.summary
      .mockImplementationOnce((_date, _username, signal) => {
        oldSignal = signal;
        return new Promise((resolve) => {
          finishOldSummary = resolve;
        });
      })
      .mockResolvedValueOnce(newSummary);
    const { result, rerender } = renderHook(
      ({ scopeKey }) => useDashboardData('2026-09-25', '', scopeKey),
      { initialProps: { scopeKey: 'manager-a' } },
    );
    await waitFor(() => expect(oldSignal).toBeInstanceOf(AbortSignal));

    rerender({ scopeKey: 'manager-b' });
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.data?.summary).toEqual(newSummary));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => finishOldSummary(summary));
    expect(result.current.data.summary).toEqual(newSummary);
  });

  it('mantém os dados durante atualização manual', async () => {
    const { result } = renderHook(() => useDashboardData('2026-09-25', ''));
    await waitFor(() => expect(result.current.data?.summary).toEqual(summary));
    let finish;
    api.summary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    act(() => {
      result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.data.summary).toEqual(summary);
    await act(async () => finish(summary));
    expect(result.current.refreshing).toBe(false);
  });

  it('separa falha parcial de uma lista vazia válida', async () => {
    api.realtime.mockRejectedValue(new Error('API indisponível'));
    const { result } = renderHook(() => useDashboardData('2026-09-25', ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.availability.realtime).toBe(false);
    expect(result.current.data.availability.users).toBe(true);
    expect(result.current.error).toMatch(/Atividade: API indisponível/);
  });

  it('rejects a valid summary for a different date', async () => {
    api.summary.mockResolvedValue({ date: '2026-09-24', users: [] });
    const { result } = renderHook(() => useDashboardData('2026-09-25', ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.availability.summary).toBe(false);
    expect(result.current.data.summary).toBeNull();
  });
});
