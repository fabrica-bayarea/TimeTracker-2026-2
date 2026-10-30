import { useCallback, useEffect, useRef, useState } from 'react';
import { validUuid } from '../../../shared/api/validators';

export function useTasks(taskService, { demo = false } = {}) {
  const [tasks, setTasks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(Boolean(taskService));
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(
    typeof taskService?.collaborators === 'function',
  );
  const [error, setError] = useState(null);
  const [collaboratorsError, setCollaboratorsError] = useState(null);
  const [mutation, setMutation] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [mutationSuccess, setMutationSuccess] = useState(null);
  const activeLoad = useRef(null);
  const activeMutation = useRef(null);
  const mutationInProgress = useRef(false);
  const loadSequence = useRef(0);
  const taskVersion = useRef(0);

  const load = useCallback(async () => {
    activeLoad.current?.abort();
    if (!taskService) {
      setLoading(false);
      setCollaboratorsLoading(false);
      return;
    }

    const controller = new AbortController();
    activeLoad.current = controller;
    const sequence = ++loadSequence.current;
    const version = taskVersion.current;
    setLoading(true);
    const canLoadCollaborators = typeof taskService.collaborators === 'function';
    setCollaboratorsLoading(canLoadCollaborators);
    setError(null);
    setCollaboratorsError(null);

    const [taskResult, collaboratorResult] = await Promise.allSettled([
      taskService.tasks(controller.signal),
      canLoadCollaborators ? taskService.collaborators(controller.signal) : Promise.resolve([]),
    ]);
    if (controller.signal.aborted || sequence !== loadSequence.current) return;

    if (taskResult.status === 'fulfilled') {
      if (version === taskVersion.current) setTasks(taskResult.value);
    } else setError(taskResult.reason?.message || 'Não foi possível carregar as Tasks.');

    if (collaboratorResult.status === 'fulfilled') setCollaborators(collaboratorResult.value);
    else {
      setCollaboratorsError(
        collaboratorResult.reason?.message || 'Não foi possível carregar os colaboradores.',
      );
    }
    setCollaboratorsLoading(false);
    setLoading(false);
  }, [taskService]);

  useEffect(() => {
    void load();
    return () => {
      activeLoad.current?.abort();
      activeMutation.current?.controller.abort();
    };
  }, [load]);

  const mutate = useCallback(
    async (operation, taskId, payload) => {
      if (!taskService || mutationInProgress.current) return false;
      if (['update', 'delete'].includes(operation) && !validUuid(taskId)) {
        setMutationError('ID de Task inválido.');
        setMutationSuccess(null);
        return false;
      }

      const controller = new AbortController();
      const operationState = { controller, type: operation };
      activeMutation.current = operationState;
      mutationInProgress.current = true;
      setMutation(operation);
      setMutationError(null);
      setMutationSuccess(null);

      try {
        let result;
        if (operation === 'create')
          result = await taskService.createTask(payload, controller.signal);
        if (operation === 'update')
          result = await taskService.updateTask(taskId, payload, controller.signal);
        if (operation === 'delete')
          result = await taskService.deleteTask(taskId, controller.signal);
        if (controller.signal.aborted) return false;

        if (operation === 'update' && result?.id !== taskId) {
          throw new Error('A API retornou um ID diferente para a Task atualizada.');
        }
        if (operation === 'create' && tasks.some((task) => task.id === result?.id)) {
          throw new Error('A API retornou um ID de Task que já está em uso.');
        }

        taskVersion.current += 1;
        if (operation === 'create') setTasks((current) => [...current, result]);
        if (operation === 'update')
          setTasks((current) => current.map((task) => (task.id === taskId ? result : task)));
        if (operation === 'delete')
          setTasks((current) => current.filter((task) => task.id !== taskId));

        const messages = demo
          ? {
              create: 'Task criada nos dados simulados.',
              update: 'Task atualizada nos dados simulados.',
              delete: 'Task excluída dos dados simulados.',
            }
          : {
              create: 'Task criada.',
              update: 'Task atualizada.',
              delete: 'Task excluída.',
            };
        setMutationSuccess(messages[operation]);
        return true;
      } catch (cause) {
        if (!controller.signal.aborted) {
          setMutationError(cause?.message || 'Não foi possível concluir a operação da Task.');
        }
        return false;
      } finally {
        if (activeMutation.current === operationState) {
          activeMutation.current = null;
          mutationInProgress.current = false;
          if (!controller.signal.aborted) setMutation(null);
        }
      }
    },
    [demo, taskService, tasks],
  );

  const createTask = useCallback((payload) => mutate('create', null, payload), [mutate]);
  const updateTask = useCallback((taskId, payload) => mutate('update', taskId, payload), [mutate]);
  const deleteTask = useCallback((taskId) => mutate('delete', taskId), [mutate]);
  const retryCollaborators = useCallback(() => {
    if (typeof taskService?.collaborators === 'function') void load();
  }, [load, taskService]);

  return {
    tasks,
    collaborators,
    loading,
    collaboratorsLoading,
    error,
    collaboratorsError,
    mutation,
    mutationBusy: Boolean(mutation),
    mutationError,
    mutationSuccess,
    load,
    retryCollaborators,
    createTask,
    updateTask,
    deleteTask,
  };
}
