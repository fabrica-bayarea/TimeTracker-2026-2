import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api/api';
import { requestFailure } from '../../../shared/lib/requestFailure';
import { useAutoRefresh } from './useAutoRefresh';

const initial = {
  key: null,
  loading: true,
  refreshing: false,
  error: null,
  data: null,
  updatedAt: null,
};

export function useDashboardData(date, username, scopeKey = '', enabled = true) {
  const [state, setState] = useState(initial);
  const active = useRef(null);
  const sequence = useRef(0);
  const previousQuery = useRef(null);

  const load = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const current = ++sequence.current;
    const query = `${scopeKey}|${date}|${username}`;
    if (!enabled) {
      previousQuery.current = query;
      setState({ ...initial, key: query, loading: false });
      return;
    }
    const changed = previousQuery.current !== query;
    previousQuery.current = query;
    setState((previous) => ({
      ...previous,
      key: query,
      data: changed ? null : previous.data,
      updatedAt: changed ? null : previous.updatedAt,
      loading: changed || !previous.data,
      refreshing: !changed && !!previous.data,
      error: null,
    }));
    const [summary, users, realtime] = await Promise.allSettled([
      api.summary(date, username, controller.signal),
      api.users(controller.signal),
      api.realtime(controller.signal),
    ]);
    if (controller.signal.aborted || current !== sequence.current) return;
    const availability = {
      summary:
        summary.status === 'fulfilled' &&
        summary.value.date === date &&
        (!username || summary.value.users.every((user) => user.username === username)),
      users: users.status === 'fulfilled',
      realtime: realtime.status === 'fulfilled',
    };
    setState({
      key: query,
      loading: false,
      refreshing: false,
      error:
        [
          requestFailure(summary, availability.summary, 'Resumo'),
          requestFailure(users, availability.users, 'Usuários'),
          requestFailure(realtime, availability.realtime, 'Atividade'),
        ]
          .filter(Boolean)
          .join('; ') || null,
      data: {
        summary: availability.summary ? summary.value : null,
        users: availability.users ? users.value : [],
        realtime: availability.realtime ? realtime.value : [],
        availability,
      },
      updatedAt: Object.values(availability).some(Boolean) ? new Date() : null,
    });
  }, [date, enabled, scopeKey, username]);

  useEffect(() => {
    load();
    return () => active.current?.abort();
  }, [load]);
  useAutoRefresh(load, enabled);

  const currentState = state.key === `${scopeKey}|${date}|${username}` ? state : initial;
  return { ...currentState, refresh: load };
}
