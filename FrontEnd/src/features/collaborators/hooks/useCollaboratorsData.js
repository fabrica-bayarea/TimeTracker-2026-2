import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../shared/api/api';
import { requestFailure } from '../../../shared/lib/requestFailure';
import { deriveTeam } from '../../../shared/lib/team';

export function useCollaboratorsData() {
  const [state, setState] = useState({
    loading: true,
    users: null,
    realtime: null,
    error: null,
    refreshState: 'loading',
    lastUpdatedAt: null,
    realtimeObservedAt: null,
  });
  const active = useRef(null);
  const sequence = useRef(0);

  const refresh = useCallback(() => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const current = ++sequence.current;
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      refreshState: 'loading',
    }));
    const observeResponse = (promise) =>
      promise.then((value) => ({
        value,
        receivedAt: Date.now(),
        observedAt: performance.now(),
      }));
    Promise.allSettled([
      observeResponse(api.users(controller.signal)),
      observeResponse(api.realtime(controller.signal)),
    ]).then(([users, realtime]) => {
      if (controller.signal.aborted || current !== sequence.current) return;
      const successfulResponses = [users, realtime].filter(
        (result) => result.status === 'fulfilled',
      );
      const receivedAt = successfulResponses.map((result) => result.value.receivedAt);

      setState((previous) => ({
        loading: false,
        users: users.status === 'fulfilled' ? users.value.value : previous.users,
        realtime: realtime.status === 'fulfilled' ? realtime.value.value : previous.realtime,
        error:
          [
            requestFailure(users, users.status === 'fulfilled', 'Usuários'),
            requestFailure(realtime, realtime.status === 'fulfilled', 'Atividade'),
          ]
            .filter(Boolean)
            .join('; ') || null,
        refreshState:
          successfulResponses.length === 2
            ? 'complete'
            : successfulResponses.length === 1
              ? 'partial'
              : 'failed',
        lastUpdatedAt: receivedAt.length ? Math.max(...receivedAt) : previous.lastUpdatedAt,
        realtimeObservedAt: realtime.status === 'fulfilled' ? realtime.value.observedAt : null,
      }));
    });
  }, []);

  useEffect(() => {
    refresh();
    return () => active.current?.abort();
  }, [refresh]);

  const people = useMemo(
    () =>
      state.users && state.realtime ? deriveTeam(state.users, state.realtime) : state.users || [],
    [state.users, state.realtime],
  );
  return { ...state, people, refresh };
}
