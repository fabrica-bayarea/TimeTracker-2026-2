import { useCallback, useEffect, useRef, useState } from 'react';
import { validTaskDescription } from '../../../shared/api/validators';

export function useTasks(devApi) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [created, setCreated] = useState(false);
  const active = useRef(null);
  const activeSave = useRef(null);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await devApi.tasks(controller.signal);
      if (!controller.signal.aborted) setTasks(response);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause.message || 'Não foi possível carregar as Tasks.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [devApi]);

  useEffect(() => {
    load();
    return () => {
      active.current?.abort();
      activeSave.current?.abort();
    };
  }, [load]);

  const createTask = useCallback(
    async (description) => {
      if (savingRef.current) return false;
      setSaveError(null);
      setCreated(false);
      if (!validTaskDescription(description)) {
        setSaveError('Informe uma descrição de até 200 caracteres.');
        return false;
      }
      const controller = new AbortController();
      activeSave.current = controller;
      savingRef.current = true;
      setSaving(true);
      try {
        const task = await devApi.createTask(description, controller.signal);
        if (controller.signal.aborted) return false;
        setTasks((current) => [...current, task]);
        setCreated(true);
        return true;
      } catch (cause) {
        if (!controller.signal.aborted)
          setSaveError(cause.message || 'Não foi possível criar a Task.');
        return false;
      } finally {
        if (activeSave.current === controller) {
          activeSave.current = null;
          savingRef.current = false;
          if (!controller.signal.aborted) setSaving(false);
        }
      }
    },
    [devApi],
  );

  return { tasks, loading, error, saving, saveError, created, load, createTask };
}
