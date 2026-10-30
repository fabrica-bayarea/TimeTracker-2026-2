import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from './useTasks';

const ana = {
  id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
  username: 'ana',
  full_name: 'Ana Souza',
};
const bruno = {
  id: '52ba0ef0-0c95-4cbf-b5a8-897b0b93ef27',
  username: 'bruno',
  full_name: 'Bruno Lima',
};
const demoTask = {
  id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  title: 'Revisar relatório',
  description: 'Revisar relatório trimestral',
  collaborators: [ana],
  created_at: '2026-10-13T14:20:00Z',
  updated_at: '2026-10-13T14:20:00Z',
};
const createdTask = {
  ...demoTask,
  id: '7e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  title: 'Nova Task',
  collaborators: [ana, bruno],
};

let taskService;
beforeEach(() => {
  taskService = {
    tasks: vi.fn().mockResolvedValue([]),
    collaborators: vi.fn().mockResolvedValue([ana, bruno]),
    createTask: vi.fn().mockResolvedValue(createdTask),
    updateTask: vi.fn().mockResolvedValue({ ...demoTask, title: 'Título atualizado' }),
    deleteTask: vi.fn().mockResolvedValue(demoTask),
  };
});

describe('useTasks', () => {
  it('carrega Tasks e colaboradores e cria uma Task pelo serviço injetado', async () => {
    taskService.tasks.mockResolvedValue([demoTask]);
    const { result } = renderHook(() => useTasks(taskService, { demo: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([demoTask]);
    expect(result.current.collaborators).toEqual([ana, bruno]);

    const payload = {
      title: 'Nova Task',
      description: 'Descrição da nova Task',
      collaborator_ids: [ana.id, bruno.id],
    };
    await act(async () => expect(await result.current.createTask(payload)).toBe(true));
    expect(taskService.createTask).toHaveBeenCalledWith(payload, expect.any(AbortSignal));
    expect(result.current.tasks).toEqual([demoTask, createdTask]);
    expect(result.current.mutationSuccess).toBe('Task criada nos dados simulados.');
  });

  it('atualiza e exclui Tasks pela camada de serviço', async () => {
    taskService.tasks.mockResolvedValue([demoTask]);
    const { result } = renderHook(() => useTasks(taskService, { demo: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const payload = {
      title: 'Título atualizado',
      description: demoTask.description,
      collaborator_ids: [ana.id],
    };
    await act(async () => expect(await result.current.updateTask(demoTask.id, payload)).toBe(true));
    expect(taskService.updateTask).toHaveBeenCalledWith(
      demoTask.id,
      payload,
      expect.any(AbortSignal),
    );
    expect(result.current.tasks[0].title).toBe('Título atualizado');

    await act(async () => expect(await result.current.deleteTask(demoTask.id)).toBe(true));
    expect(taskService.deleteTask).toHaveBeenCalledWith(demoTask.id, expect.any(AbortSignal));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.mutationSuccess).toBe('Task excluída dos dados simulados.');
  });

  it('mantém estado de erro de consulta e permite retry', async () => {
    taskService.tasks
      .mockRejectedValueOnce(new Error('API indisponível'))
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.error).toBe('API indisponível'));
    await act(async () => result.current.load());
    expect(result.current.error).toBeNull();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.collaborators).toEqual([ana, bruno]);
  });

  it('mantém erro de colaboradores independente da lista de Tasks', async () => {
    taskService.collaborators.mockRejectedValueOnce(new Error('Equipe indisponível'));
    taskService.tasks.mockResolvedValue([demoTask]);
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([demoTask]);
    expect(result.current.collaboratorsError).toBe('Equipe indisponível');
  });

  it('ignora um segundo envio enquanto a criação anterior está em andamento', async () => {
    let finish;
    taskService.createTask.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const payload = {
      title: 'Nova Task',
      description: 'Descrição',
      collaborator_ids: [ana.id],
    };

    let first;
    let second;
    await act(async () => {
      first = result.current.createTask(payload);
      second = result.current.createTask(payload);
      await expect(second).resolves.toBe(false);
    });
    expect(taskService.createTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish(createdTask);
      await expect(first).resolves.toBe(true);
    });
    expect(result.current.tasks).toEqual([createdTask]);
  });

  it('mostra falha de gravação e mantém a lista quando o serviço rejeita', async () => {
    taskService.tasks.mockResolvedValue([demoTask]);
    taskService.updateTask.mockRejectedValueOnce(new Error('Conflito ao atualizar'));
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.updateTask(demoTask.id, {})).resolves.toBe(false);
    });
    expect(result.current.mutationError).toBe('Conflito ao atualizar');
    expect(result.current.tasks).toEqual([demoTask]);
  });

  it('ignora a resposta de uma carga anterior cancelada', async () => {
    let finishFirst;
    let firstSignal;
    taskService.tasks.mockImplementationOnce((signal) => {
      firstSignal = signal;
      return new Promise((resolve) => {
        finishFirst = resolve;
      });
    });
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(firstSignal).toBeInstanceOf(AbortSignal));

    await act(async () => result.current.load());
    expect(firstSignal.aborted).toBe(true);
    await act(async () => finishFirst([demoTask]));
    expect(result.current.tasks).toEqual([]);
  });

  it('não deixa uma consulta iniciada antes da mutação sobrescrever seu resultado', async () => {
    let finishRefresh;
    taskService.tasks.mockResolvedValueOnce([demoTask]).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
    taskService.updateTask.mockResolvedValue({ ...demoTask, title: 'Atualização mais recente' });
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pendingRefresh;
    act(() => {
      pendingRefresh = result.current.load();
    });
    await waitFor(() => expect(finishRefresh).toBeDefined());
    await act(async () => {
      await expect(result.current.updateTask(demoTask.id, {})).resolves.toBe(true);
    });
    await act(async () => {
      finishRefresh([demoTask]);
      await pendingRefresh;
    });

    expect(result.current.tasks[0].title).toBe('Atualização mais recente');
  });

  it('cancela uma criação pendente ao desmontar o hook', async () => {
    let finish;
    let signal;
    taskService.createTask.mockImplementation((_payload, requestSignal) => {
      signal = requestSignal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const { result, unmount } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const payload = {
      title: 'Nova Task',
      description: 'Descrição',
      collaborator_ids: [ana.id],
    };

    let pending;
    await act(async () => {
      pending = result.current.createTask(payload);
    });
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      finish(createdTask);
      await expect(pending).resolves.toBe(false);
    });
  });

  it.each(['update', 'delete'])(
    'cancela uma %s pendente ao desmontar o hook',
    async (operation) => {
      let finish;
      let signal;
      taskService[`${operation}Task`].mockImplementation((...args) => {
        signal = args.at(-1);
        return new Promise((resolve) => {
          finish = resolve;
        });
      });
      const { result, unmount } = renderHook(() => useTasks(taskService));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let pending;
      await act(async () => {
        pending =
          operation === 'update'
            ? result.current.updateTask(demoTask.id, { title: 'Atualizada' })
            : result.current.deleteTask(demoTask.id);
      });
      expect(signal).toBeInstanceOf(AbortSignal);
      unmount();
      expect(signal.aborted).toBe(true);

      await act(async () => {
        finish(operation === 'update' ? demoTask : undefined);
        await expect(pending).resolves.toBe(false);
      });
    },
  );

  it('não consulta nem modifica dados quando nenhum serviço está injetado', async () => {
    const { result } = renderHook(() => useTasks(null));
    expect(result.current.loading).toBe(false);
    await act(async () => expect(await result.current.createTask({})).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it('não consulta /users quando o cliente real não oferece listagem segura da equipe', async () => {
    const managerApi = {
      tasks: vi.fn().mockResolvedValue([demoTask]),
      createTask: vi.fn().mockResolvedValue({ ...createdTask, collaborators: [] }),
      updateTask: vi.fn(),
      deleteTask: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() => useTasks(managerApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([demoTask]);
    expect(result.current.collaborators).toEqual([]);
    expect(result.current.collaboratorsError).toBeNull();
    expect(managerApi.tasks).toHaveBeenCalledOnce();
    expect(managerApi).not.toHaveProperty('collaborators');

    await act(async () =>
      expect(
        await result.current.createTask({ title: 'Task sem atribuição', collaborator_ids: [] }),
      ).toBe(true),
    );
    expect(result.current.mutationSuccess).toBe('Task criada.');
  });

  it('valida ID de Task antes de mutação e não confirma falha', async () => {
    const { result } = renderHook(() => useTasks(taskService));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => expect(await result.current.deleteTask('id-invalido')).toBe(false));
    expect(taskService.deleteTask).not.toHaveBeenCalled();
    expect(result.current.mutationError).toBe('ID de Task inválido.');
    expect(result.current.mutationSuccess).toBeNull();
  });
});
