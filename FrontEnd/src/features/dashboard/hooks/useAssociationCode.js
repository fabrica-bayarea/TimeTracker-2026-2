import { useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api/api';

const CODE_PATTERN = /^\d{6}$/;

function failureMessage(error) {
  if (error?.status === 401) {
    return 'Sua sessão não pôde ser validada. Entre novamente para consultar o código.';
  }
  if (error?.type === 'timeout') {
    return 'A consulta do código excedeu o tempo limite. Tente novamente.';
  }
  return 'Não foi possível consultar o código de associação. Tente novamente.';
}

/**
 * Loads the authenticated manager's code through an optional client adapter.
 * The adapter is a frontend seam for tests/future integration, not an HTTP contract.
 * The manager ID scopes local state and is never passed to the client.
 *
 * @param {string | null | undefined} managerId
 * @param {{ getAssociationCode?: (signal: AbortSignal) => Promise<unknown> }} [client]
 */
export function useAssociationCode(managerId, client = api) {
  const [state, setState] = useState({ managerId: null, status: 'idle', code: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const sequence = useRef(0);

  useEffect(() => {
    const current = ++sequence.current;
    if (!managerId) {
      setState({ managerId: null, status: 'idle', code: null, error: null });
      return undefined;
    }

    const controller = new AbortController();
    const lookup = client?.getAssociationCode;
    if (typeof lookup !== 'function') {
      setState({ managerId, status: 'pending', code: null, error: null });
      return () => {
        controller.abort();
        if (sequence.current === current) sequence.current += 1;
      };
    }

    setState({ managerId, status: 'loading', code: null, error: null });
    Promise.resolve()
      .then(() => lookup.call(client, controller.signal))
      .then((code) => {
        if (controller.signal.aborted || current !== sequence.current) return;
        if (typeof code !== 'string' || !CODE_PATTERN.test(code)) {
          setState({
            managerId,
            status: 'error',
            code: null,
            error: 'A API retornou um código de associação inválido.',
          });
          return;
        }
        setState({ managerId, status: 'ready', code, error: null });
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          error?.type === 'canceled' ||
          current !== sequence.current
        ) {
          return;
        }
        setState({ managerId, status: 'error', code: null, error: failureMessage(error) });
      });

    return () => {
      controller.abort();
      if (sequence.current === current) sequence.current += 1;
    };
  }, [managerId, client, attempt]);

  const currentState = state.managerId === managerId ? state : null;
  return {
    code: currentState?.status === 'ready' ? currentState.code : null,
    loading: !!managerId && (!currentState || currentState.status === 'loading'),
    pending: !!managerId && currentState?.status === 'pending',
    error: currentState?.status === 'error' ? currentState.error : null,
    retry: () => setAttempt((value) => value + 1),
  };
}
