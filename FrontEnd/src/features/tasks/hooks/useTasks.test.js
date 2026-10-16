import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from './useTasks';

const demoTask = {
  id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  description: 'Revisar relatório',
  created_at: '2026-10-13T14:20:00Z',
  updated_at: '2026-10-13T14:20:00Z',
};
const createdTask = {
  ...demoTask,
  id: '7e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  description: 'Task nova',
};

let devApi;
beforeEach(() => {
  devApi = {
    tasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn().mockResolvedValue(createdTask),
  };
});

describe('useTasks', () => {
  it('carrega a lista e cria uma Task validada', async () => {
    devApi.tasks.mockResolvedValue([demoTask]);
    const { result } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([demoTask]);

    await act(async () => expect(await result.current.createTask('Task nova')).toBe(true));
    expect(devApi.createTask).toHaveBeenCalledWith('Task nova', expect.any(AbortSignal));
    expect(result.current.tasks).toEqual([demoTask, createdTask]);
    expect(result.current.created).toBe(true);
  });

  it('mantém o estado de erro e permite retry', async () => {
    devApi.tasks.mockRejectedValueOnce(new Error('API indisponível')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(result.current.error).toBe('API indisponível'));
    await act(async () => result.current.load());
    expect(result.current.error).toBeNull();
    expect(result.current.tasks).toEqual([]);
  });

  it('bloqueia descrição inválida antes de chamar a API', async () => {
    const { result } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => expect(await result.current.createTask('  ')).toBe(false));
    expect(result.current.saveError).toMatch(/descrição/);
    expect(devApi.createTask).not.toHaveBeenCalled();
  });

  it('ignora um segundo envio enquanto a criação anterior está em andamento', async () => {
    let finish;
    devApi.createTask.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let first;
    let second;
    await act(async () => {
      first = result.current.createTask('Task nova');
      second = result.current.createTask('Task duplicada');
      await expect(second).resolves.toBe(false);
    });
    expect(devApi.createTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish(createdTask);
      await expect(first).resolves.toBe(true);
    });
    expect(result.current.tasks).toEqual([createdTask]);
  });

  it('aborts an older load and ignores its delayed response', async () => {
    let finishFirst;
    let firstSignal;
    devApi.tasks.mockImplementationOnce((signal) => {
      firstSignal = signal;
      return new Promise((resolve) => {
        finishFirst = resolve;
      });
    });
    const { result } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(firstSignal).toBeInstanceOf(AbortSignal));

    await act(async () => result.current.load());
    expect(firstSignal.aborted).toBe(true);
    await act(async () => finishFirst([demoTask]));
    expect(result.current.tasks).toEqual([]);
  });

  it('aborts a pending create when the hook unmounts', async () => {
    let finish;
    let signal;
    devApi.createTask.mockImplementation((_description, requestSignal) => {
      signal = requestSignal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const { result, unmount } = renderHook(() => useTasks(devApi));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending;
    await act(async () => {
      pending = result.current.createTask('Task nova');
    });
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      finish(createdTask);
      await expect(pending).resolves.toBe(false);
    });
  });
});
