import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTaskAnalyticsSource } from '../services/taskAnalyticsSource';
import { validTaskSummary } from '../../../shared/api/validators';
import { useAutoRefresh } from './useAutoRefresh';

const emptyTasks = { key: null, tasks: [], loading: true, error: null };
const emptySummary = { key: null, summary: null, loading: false, error: null };

export function useTaskAnalytics(
  devApi,
  date,
  username,
  taskId,
  { scopeKey = '', enabled = true } = {},
) {
  const source = useMemo(() => createTaskAnalyticsSource({ demoClient: devApi }), [devApi]);
  const tasksKey = String(scopeKey || '');
  const summaryKey = `${tasksKey}|${date}|${username}|${taskId}`;
  const [tasksResult, setTasksResult] = useState(emptyTasks);
  const [summaryResult, setSummaryResult] = useState(emptySummary);
  const tasksRequest = useRef(null);
  const summaryRequest = useRef(null);
  const tasksSequence = useRef(0);
  const summarySequence = useRef(0);

  const loadTasks = useCallback(async () => {
    tasksRequest.current?.abort();
    if (!enabled) {
      setTasksResult({ key: tasksKey, tasks: [], loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    tasksRequest.current = controller;
    const sequence = ++tasksSequence.current;
    setTasksResult({ key: tasksKey, tasks: [], loading: true, error: null });
    try {
      const response = await source.tasks(controller.signal);
      if (!controller.signal.aborted && sequence === tasksSequence.current) {
        setTasksResult({ key: tasksKey, tasks: response, loading: false, error: null });
      }
    } catch (cause) {
      if (!controller.signal.aborted && sequence === tasksSequence.current) {
        setTasksResult({
          key: tasksKey,
          tasks: [],
          loading: false,
          error: cause?.message || 'Não foi possível carregar a lista de Tasks.',
        });
      }
    }
  }, [enabled, source, tasksKey]);

  const loadSummary = useCallback(async () => {
    summaryRequest.current?.abort();
    const sequence = ++summarySequence.current;
    if (!enabled || !source.summary) {
      setSummaryResult({ key: summaryKey, summary: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    summaryRequest.current = controller;
    setSummaryResult({ key: summaryKey, summary: null, loading: true, error: null });
    try {
      const response = await source.summary(date, username, taskId, controller.signal);
      if (!validTaskSummary(response) || response.date !== date) {
        throw new Error('A resposta do resumo é inválida ou não corresponde à data selecionada.');
      }
      if (!controller.signal.aborted && sequence === summarySequence.current) {
        setSummaryResult({ key: summaryKey, summary: response, loading: false, error: null });
      }
    } catch (cause) {
      if (!controller.signal.aborted && sequence === summarySequence.current) {
        setSummaryResult({
          key: summaryKey,
          summary: null,
          loading: false,
          error: cause?.message || 'Não foi possível carregar o resumo por Task.',
        });
      }
    }
  }, [date, enabled, source, summaryKey, taskId, username]);

  useEffect(() => {
    void loadTasks();
    return () => tasksRequest.current?.abort();
  }, [loadTasks]);

  useEffect(() => {
    void loadSummary();
    return () => summaryRequest.current?.abort();
  }, [loadSummary]);

  const refresh = useCallback(
    () => Promise.all([loadTasks(), loadSummary()]),
    [loadSummary, loadTasks],
  );

  useAutoRefresh(refresh, enabled && source.mode === 'demo');

  const retry = useCallback(() => {
    void refresh();
  }, [refresh]);
  const currentTasks = tasksResult.key === tasksKey ? tasksResult : emptyTasks;
  const currentSummary = summaryResult.key === summaryKey ? summaryResult : emptySummary;

  return {
    tasks: currentTasks.tasks,
    tasksAvailable: enabled && !currentTasks.loading && !currentTasks.error,
    tasksLoading: currentTasks.loading,
    tasksError: currentTasks.error,
    summary: currentSummary.summary,
    summaryLoading: currentSummary.loading,
    summaryError: currentSummary.error,
    summaryMode: source.mode,
    retry,
    retryTasks: loadTasks,
    retrySummary: loadSummary,
  };
}
