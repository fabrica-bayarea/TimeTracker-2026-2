import { http, HttpResponse } from 'msw';
import { isIsoDate } from '../shared/lib/date';
import {
  validTaskHours,
  validTaskCreatePayload,
  validTask,
  validTaskUpdatePayload,
  validTaskSummary,
  validAttendance,
  validManager,
  validManagerProfile,
  validManagerToken,
} from '../shared/api/validators';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TIMEZONE = 'America/Sao_Paulo';
let tasks = [];
let sequence = 0;
const DEMO_MANAGER_ID = 'b06e3df5-c23b-49ec-9a40-081a451620b3';
const DEMO_MANAGER_TOKEN = `eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZXYtbWFuYWdlciJ9.${'A'.repeat(43)}`;
const DEFAULT_DEMO_EMAIL = 'gestor@demo.local';
let demoManagerEmail = DEFAULT_DEMO_EMAIL;
const collaborators = [
  {
    id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
    username: 'ana',
    full_name: 'Ana Souza',
    department: 'Produto',
  },
  {
    id: '52ba0ef0-0c95-4cbf-b5a8-897b0b93ef27',
    username: 'bruno',
    full_name: 'Bruno Lima',
    department: 'Tecnologia',
  },
];

function makeTaskId() {
  sequence += 1;
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

function taskBodyIsValid(body, { partial = false } = {}) {
  const collaboratorIds = body?.collaborator_ids;
  const schemaValid = partial ? validTaskUpdatePayload(body) : validTaskCreatePayload(body);
  return (
    schemaValid &&
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    (!Object.hasOwn(body, 'collaborator_ids') ||
      collaboratorIds.every((id) => collaborators.some((person) => person.id === id)))
  );
}

function credentialsAreValid(body, { register = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    return false;
  if (typeof body.password !== 'string' || body.password.length === 0) return false;
  if (!register) return true;
  const bytes = new TextEncoder().encode(body.password).length;
  return Array.from(body.password).length >= 8 && bytes <= 72;
}

function demoManager(email = demoManagerEmail) {
  return {
    id: DEMO_MANAGER_ID,
    email: email.trim().toLowerCase(),
    created_at: '2026-10-21T12:00:00Z',
  };
}

function demoManagerProfile(email = demoManagerEmail) {
  return { ...demoManager(email), association_code: '001234' };
}

function isDemoManagerRequest(request) {
  return request.headers.get('authorization') === `Bearer ${DEMO_MANAGER_TOKEN}`;
}

function unauthorizedResponse() {
  return HttpResponse.json({ detail: 'Token demonstrativo inválido' }, { status: 401 });
}

function taskFromBody(body, previous = null) {
  const now = new Date().toISOString();
  return {
    id: previous?.id || makeTaskId(),
    title: Object.hasOwn(body, 'title') ? body.title.trim() : previous?.title,
    description: Object.hasOwn(body, 'description')
      ? body.description?.trim() || null
      : previous?.description || null,
    collaborators: Object.hasOwn(body, 'collaborator_ids')
      ? body.collaborator_ids.map((id) => {
          const person = collaborators.find((entry) => entry.id === id);
          return { id: person.id, username: person.username, full_name: person.full_name };
        })
      : previous?.collaborators || [],
    created_at: previous?.created_at || now,
    updated_at: now,
  };
}

function timestampAt(date, hour, minute) {
  return new Date(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`,
  ).toISOString();
}

function attendanceFor(date, username) {
  const people = [
    {
      username: 'ana',
      first_activity_at: timestampAt(date, 8, 15),
      last_activity_at: timestampAt(date, 17, 42),
    },
    { username: 'bruno', first_activity_at: null, last_activity_at: null },
  ];
  const users = username ? people.filter((person) => person.username === username) : people;
  return { date, timezone: TIMEZONE, as_of: new Date().toISOString(), users };
}

export function resetMockData() {
  tasks = [];
  sequence = 0;
  demoManagerEmail = DEFAULT_DEMO_EMAIL;
}

export const handlers = [
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json().catch(() => null);
    if (!credentialsAreValid(body, { register: true })) {
      return HttpResponse.json({ detail: 'Credenciais inválidas' }, { status: 422 });
    }
    demoManagerEmail = body.email.trim().toLowerCase();
    const manager = demoManager();
    return validManager(manager)
      ? HttpResponse.json(manager, { status: 201 })
      : HttpResponse.json({ detail: 'Gestor demonstrativo inválido' }, { status: 500 });
  }),
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json().catch(() => null);
    if (!credentialsAreValid(body)) {
      return HttpResponse.json({ detail: 'Credenciais inválidas' }, { status: 422 });
    }
    demoManagerEmail = body.email.trim().toLowerCase();
    const token = { access_token: DEMO_MANAGER_TOKEN, token_type: 'bearer', expires_in: 3600 };
    return validManagerToken(token)
      ? HttpResponse.json(token)
      : HttpResponse.json({ detail: 'Token demonstrativo inválido' }, { status: 500 });
  }),
  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    if (request.headers.get('authorization') !== `Bearer ${DEMO_MANAGER_TOKEN}`) {
      return HttpResponse.json({ detail: 'Token demonstrativo inválido' }, { status: 401 });
    }
    const manager = demoManagerProfile();
    return validManagerProfile(manager)
      ? HttpResponse.json(manager)
      : HttpResponse.json({ detail: 'Gestor demonstrativo inválido' }, { status: 500 });
  }),
  http.get(`${API_BASE_URL}/users/`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    return HttpResponse.json(collaborators);
  }),
  http.get(`${API_BASE_URL}/tasks/`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    return HttpResponse.json(tasks);
  }),
  http.get(`${API_BASE_URL}/tasks/:task_id`, ({ params, request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(params.task_id)) {
      return HttpResponse.json({ detail: 'ID de Task inválido' }, { status: 422 });
    }
    const task = tasks.find((entry) => entry.id === params.task_id);
    return task
      ? HttpResponse.json(task)
      : HttpResponse.json({ detail: 'Task não encontrada' }, { status: 404 });
  }),
  http.post(`${API_BASE_URL}/tasks/`, async ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const body = await request.json().catch(() => null);
    if (!taskBodyIsValid(body)) {
      return HttpResponse.json({ detail: 'Descrição inválida' }, { status: 422 });
    }

    const task = taskFromBody(body);
    if (!validTask(task)) return HttpResponse.json({ detail: 'Task inválida' }, { status: 500 });
    tasks = [...tasks, task];
    return HttpResponse.json(task, { status: 201 });
  }),
  http.put(`${API_BASE_URL}/tasks/:task_id`, async ({ params, request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const body = await request.json().catch(() => null);
    if (!taskBodyIsValid(body, { partial: true })) {
      return HttpResponse.json({ detail: 'Descrição inválida' }, { status: 422 });
    }
    const index = tasks.findIndex((task) => task.id === params.task_id);
    if (index < 0) return HttpResponse.json({ detail: 'Task não encontrada' }, { status: 404 });

    const task = taskFromBody(body, tasks[index]);
    if (!validTask(task)) return HttpResponse.json({ detail: 'Task inválida' }, { status: 500 });
    tasks = tasks.map((entry, current) => (current === index ? task : entry));
    return HttpResponse.json(task);
  }),
  http.delete(`${API_BASE_URL}/tasks/:task_id`, ({ params, request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const index = tasks.findIndex((task) => task.id === params.task_id);
    if (index < 0) return HttpResponse.json({ detail: 'Task não encontrada' }, { status: 404 });
    tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API_BASE_URL}/dashboard/tasks-summary`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    const taskId = url.searchParams.get('task_id');
    if (
      !isIsoDate(date) ||
      (taskId && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(taskId))
    ) {
      return HttpResponse.json({ detail: 'Filtro inválido' }, { status: 422 });
    }
    const response = { date, timezone: TIMEZONE, tasks: [] };
    return validTaskSummary(response)
      ? HttpResponse.json(response)
      : HttpResponse.json({ detail: 'Resposta inválida' }, { status: 500 });
  }),
  http.get(`${API_BASE_URL}/dashboard/attendance`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    if (!isIsoDate(date)) {
      return HttpResponse.json({ detail: 'Data inválida' }, { status: 422 });
    }
    const response = attendanceFor(date, url.searchParams.get('username') || '');
    if (!validAttendance(response)) {
      return HttpResponse.json({ detail: 'Resposta inválida' }, { status: 500 });
    }
    return HttpResponse.json(response);
  }),
  http.get(`${API_BASE_URL}/dashboard/task-hours`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date') || '';
    const endDate = url.searchParams.get('end_date') || '';
    const taskId = url.searchParams.get('task_id');
    const response = {
      start_date: startDate,
      end_date: endDate,
      timezone: TIMEZONE,
      tasks: [],
    };
    if (
      !isIsoDate(startDate) ||
      !isIsoDate(endDate) ||
      startDate > endDate ||
      (taskId && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(taskId))
    ) {
      return HttpResponse.json({ detail: 'Filtro inválido' }, { status: 422 });
    }
    return validTaskHours(response)
      ? HttpResponse.json(response)
      : HttpResponse.json({ detail: 'Resposta inválida' }, { status: 500 });
  }),
  http.get(`${API_BASE_URL}/agents/status`, ({ request }) => {
    if (!isDemoManagerRequest(request)) return unauthorizedResponse();
    const url = new URL(request.url);
    const username = url.searchParams.get('username') || '';
    const agents = [
      {
        username: 'ana',
        hostname: 'ESTACAO-01',
        last_record_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        connection_status: 'online',
      },
      {
        username: 'bruno',
        hostname: 'ESTACAO-02',
        last_record_at: null,
        connection_status: 'unknown',
      },
    ];
    return HttpResponse.json({
      agents: username ? agents.filter((agent) => agent.username === username) : agents,
    });
  }),
  http.all(`${API_BASE_URL}/*`, ({ request }) => {
    const { pathname } = new URL(request.url);
    return HttpResponse.json(
      {
        detail: `Sem mock de desenvolvimento para ${request.method} ${pathname}; chamada real bloqueada.`,
      },
      { status: 501 },
    );
  }),
];
