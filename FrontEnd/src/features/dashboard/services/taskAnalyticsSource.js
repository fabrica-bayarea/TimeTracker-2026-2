import { api } from '../../../shared/api/api';

/**
 * Keeps the development-only summary source separate from the authenticated API.
 * The current production API has a Task catalog, but no per-Task summary route.
 */
export function createTaskAnalyticsSource({
  demoClient = null,
  apiClient = api,
  demoEnabled = import.meta.env.DEV,
} = {}) {
  const useDemo = Boolean(demoEnabled && demoClient);
  const client = useDemo ? demoClient : apiClient;

  return {
    mode: useDemo ? 'demo' : 'api',
    tasks: (signal) => client.tasks(signal),
    summary:
      useDemo && typeof demoClient.taskSummary === 'function'
        ? (date, username, taskId, signal) => demoClient.taskSummary(date, username, taskId, signal)
        : null,
  };
}
