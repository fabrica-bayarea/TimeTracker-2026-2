import { requestNoContent, requestValidated } from '../shared/api/api';
import {
  validAgentStatuses,
  validAttendance,
  validTask,
  validTaskCreatePayload,
  validTaskHours,
  validTaskSummary,
  validTasks,
  validTaskUpdatePayload,
  validUsers,
} from '../shared/api/validators';
import { isIsoDate } from '../shared/lib/date';

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const request = requestValidated;

function jsonOptions(method, body, signal) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
    authenticated: true,
  };
}

function taskQuery(date, username) {
  if (!isIsoDate(date)) throw new Error('Selecione uma data válida');
  const query = new URLSearchParams({ date });
  if (username) query.set('username', username);
  return query.toString();
}

export const devApi = {
  tasks: (signal) => request('/tasks/', validTasks, { signal, authenticated: true }),
  collaborators: (signal) => request('/users/', validUsers, { signal, authenticated: true }),
  getTask(taskId, signal) {
    if (!UUID_PATTERN.test(taskId)) throw new Error('ID de Task inválido');
    return request(`/tasks/${taskId}`, validTask, { signal, authenticated: true });
  },
  createTask(task, signal) {
    if (!validTaskCreatePayload(task)) throw new Error('Informe dados válidos para a Task.');
    return request('/tasks/', validTask, jsonOptions('POST', task, signal));
  },
  updateTask(taskId, task, signal) {
    if (!UUID_PATTERN.test(taskId)) throw new Error('ID de Task inválido');
    if (!validTaskUpdatePayload(task)) throw new Error('Informe dados válidos para a Task.');
    return request(`/tasks/${taskId}`, validTask, jsonOptions('PUT', task, signal));
  },
  deleteTask(taskId, signal) {
    if (!UUID_PATTERN.test(taskId)) throw new Error('ID de Task inválido');
    return requestNoContent(`/tasks/${taskId}`, {
      method: 'DELETE',
      signal,
      authenticated: true,
    });
  },
  taskSummary(date, username = '', taskId = '', signal) {
    if (!isIsoDate(date)) throw new Error('Selecione uma data válida');
    if (taskId && !UUID_PATTERN.test(taskId)) throw new Error('ID de Task inválido');
    const query = new URLSearchParams({ date });
    if (username) query.set('username', username);
    if (taskId) query.set('task_id', taskId);
    return request(`/dashboard/tasks-summary?${query}`, validTaskSummary, {
      signal,
      authenticated: true,
    });
  },
  attendance(date, username = '', signal) {
    return request(`/dashboard/attendance?${taskQuery(date, username)}`, validAttendance, {
      signal,
      authenticated: true,
    });
  },
  taskHours(startDate, endDate, username = '', taskId = '', signal) {
    if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate > endDate) {
      throw new Error('Selecione um período válido');
    }
    if (taskId && !UUID_PATTERN.test(taskId)) throw new Error('ID de Task inválido');
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (username) query.set('username', username);
    if (taskId) query.set('task_id', taskId);
    return request(`/dashboard/task-hours?${query}`, validTaskHours, {
      signal,
      authenticated: true,
    });
  },
  agentStatuses(username = '', signal) {
    const query = new URLSearchParams();
    if (username) query.set('username', username);
    const suffix = query.size ? `?${query}` : '';
    return request(`/agents/status${suffix}`, validAgentStatuses, {
      signal,
      authenticated: true,
    });
  },
};
