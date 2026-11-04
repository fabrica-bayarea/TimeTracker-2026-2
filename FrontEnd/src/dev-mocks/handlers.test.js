import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetMockData } from './handlers';
import { devApi } from './client';
import { MANAGER_ACCESS_TOKEN_KEY } from '../shared/auth/sessionStorage';

const server = setupServer(...handlers);
const baseUrl = 'http://localhost:8000';

async function demoAuthorization() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@demo.local', password: 'senha-demonstrativa' }),
  });
  const token = await response.json();
  return { Authorization: `Bearer ${token.access_token}` };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sessionStorage.removeItem(MANAGER_ACCESS_TOKEN_KEY);
});
afterAll(() => server.close());
beforeEach(() => resetMockData());

describe('handlers das propostas de contrato', () => {
  it('simula cadastro e login locais sem aceitar isso como autenticação real', async () => {
    const invalid = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gestor@demo.local', password: 'curta' }),
    });
    expect(invalid.status).toBe(422);

    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gestor@demo.local', password: 'SenhaDemo123' }),
    });
    expect(registerResponse.status).toBe(201);
    const manager = await registerResponse.json();
    expect(manager).toMatchObject({ email: 'gestor@demo.local' });
    expect(manager).not.toHaveProperty('access_token');
    expect(manager).not.toHaveProperty('password');

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gestor@demo.local', password: 'qualquer-senha-demo' }),
    });
    const token = await loginResponse.json();
    expect(loginResponse.status).toBe(200);
    expect(token).toMatchObject({ token_type: 'bearer', expires_in: 3600 });

    const meResponse = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    expect(await meResponse.json()).toEqual({ ...manager, association_code: '001234' });

    const unauthorized = await fetch(`${baseUrl}/auth/me`);
    expect(unauthorized.status).toBe(401);
  });

  it('lista colaboradores de demonstração e executa CRUD de Tasks em memória', async () => {
    const authorization = await demoAuthorization();
    expect((await fetch(`${baseUrl}/tasks/`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/users/`)).status).toBe(401);

    const listResponse = await fetch(`${baseUrl}/tasks/`, { headers: authorization });
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([]);

    const collaboratorsResponse = await fetch(`${baseUrl}/users/`, { headers: authorization });
    expect(collaboratorsResponse.status).toBe(200);
    const collaborators = await collaboratorsResponse.json();
    expect(collaborators.map(({ username }) => username)).toEqual(['ana', 'bruno']);

    const taskPayload = {
      title: 'Fechar relatório',
      description: 'Revisar e publicar o relatório mensal',
      collaborator_ids: [collaborators[0].id, collaborators[1].id],
    };

    const createResponse = await fetch(`${baseUrl}/tasks/`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      id: expect.any(String),
      title: 'Fechar relatório',
      collaborators: [{ id: collaborators[0].id }, { id: collaborators[1].id }],
    });
    expect(created.created_at).toBe(created.updated_at);
    const persistedResponse = await fetch(`${baseUrl}/tasks/`, { headers: authorization });
    expect(persistedResponse.status).toBe(200);
    expect(await persistedResponse.json()).toEqual([created]);

    const detailResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      headers: authorization,
    });
    expect(detailResponse.status).toBe(200);
    expect(await detailResponse.json()).toEqual(created);

    const updateResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...taskPayload,
        title: 'Relatório publicado',
        collaborator_ids: [collaborators[0].id],
      }),
    });
    expect(updateResponse.status).toBe(200);
    const updated = await updateResponse.json();
    expect(updated).toMatchObject({
      id: created.id,
      title: 'Relatório publicado',
      collaborators: [{ id: collaborators[0].id }],
    });
    expect(Date.parse(updated.updated_at)).toBeGreaterThanOrEqual(Date.parse(created.updated_at));

    const removeAssignmentsResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborator_ids: [] }),
    });
    expect(removeAssignmentsResponse.status).toBe(200);
    const unassigned = await removeAssignmentsResponse.json();
    expect(unassigned.collaborators).toEqual([]);
    expect(unassigned.title).toBe(updated.title);
    expect(unassigned.description).toBe(updated.description);

    const deleteResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: 'DELETE',
      headers: authorization,
    });
    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe('');
    const afterDeleteResponse = await fetch(`${baseUrl}/tasks/`, { headers: authorization });
    expect(afterDeleteResponse.status).toBe(200);
    expect(await afterDeleteResponse.json()).toEqual([]);
  });

  it('distingue payload inválido e Task inexistente', async () => {
    const authorization = await demoAuthorization();
    const unauthorized = await fetch(`${baseUrl}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task without session',
        description: 'Must not be created',
        collaborator_ids: ['d94a4d6c-8542-4c3e-889b-89db302ef4cc'],
      }),
    });
    expect(unauthorized.status).toBe(401);

    const invalid = await fetch(`${baseUrl}/tasks/`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '  ', description: '  ', collaborator_ids: [] }),
    });
    expect(invalid.status).toBe(422);

    const missing = await fetch(`${baseUrl}/tasks/00000000-0000-4000-8000-000000000099`, {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Atualizar',
        description: 'Task',
        collaborator_ids: ['d94a4d6c-8542-4c3e-889b-89db302ef4cc'],
      }),
    });
    expect(missing.status).toBe(404);
    const missingDelete = await fetch(`${baseUrl}/tasks/00000000-0000-4000-8000-000000000099`, {
      method: 'DELETE',
      headers: authorization,
    });
    expect(missingDelete.status).toBe(404);
  });

  it('permite criar Task sem descrição ou colaboradores', async () => {
    const authorization = await demoAuthorization();
    const response = await fetch(`${baseUrl}/tasks/`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task sem atribuição', collaborator_ids: [] }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      title: 'Task sem atribuição',
      description: null,
      collaborators: [],
    });
  });

  it('responde à jornada com fuso e nulos para colaborador sem registro', async () => {
    const authorization = await demoAuthorization();
    const response = await fetch(`${baseUrl}/dashboard/attendance?date=2026-10-13`, {
      headers: authorization,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      as_of: expect.any(String),
      users: [
        {
          username: 'ana',
          first_activity_at: '2026-10-13T11:15:00.000Z',
          last_activity_at: '2026-10-13T20:42:00.000Z',
        },
        { username: 'bruno', first_activity_at: null, last_activity_at: null },
      ],
    });
  });

  it('integra devApi.createTask com o handler MSW e consulta a Task criada', async () => {
    const authorization = await demoAuthorization();
    sessionStorage.setItem(
      MANAGER_ACCESS_TOKEN_KEY,
      authorization.Authorization.replace(/^Bearer /, ''),
    );

    const created = await devApi.createTask({
      title: 'Integration client and MSW',
      description: 'Persist only during the local demonstration',
      collaborator_ids: ['d94a4d6c-8542-4c3e-889b-89db302ef4cc'],
    });

    expect(created).toMatchObject({
      id: expect.any(String),
      title: 'Integration client and MSW',
      collaborators: [{ id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc' }],
    });
    await expect(devApi.tasks()).resolves.toEqual([created]);

    resetMockData();
    await expect(devApi.tasks()).resolves.toEqual([]);
    await expect(
      devApi.createTask({
        title: 'After reset',
        description: 'The sequence should restart',
        collaborator_ids: ['d94a4d6c-8542-4c3e-889b-89db302ef4cc'],
      }),
    ).resolves.toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
    });
  });

  it('applies date and collaborator filters to business-day records', async () => {
    const authorization = await demoAuthorization();
    const response = await fetch(`${baseUrl}/dashboard/attendance?date=2026-10-14&username=ana`, {
      headers: authorization,
    });
    const body = await response.json();
    expect(body.date).toBe('2026-10-14');
    expect(body.users.map(({ username }) => username)).toEqual(['ana']);

    const first = body.users[0].first_activity_at;
    const last = body.users[0].last_activity_at;
    const format = (value, options) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Sao_Paulo',
        ...options,
      }).format(new Date(value));
    expect(format(first, { year: 'numeric', month: '2-digit', day: '2-digit' })).toBe('14/10/2026');
    expect(format(first, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })).toBe('08:15');
    expect(format(last, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })).toBe('17:42');

    const missing = await fetch(
      `${baseUrl}/dashboard/attendance?date=2026-10-14&username=unknown`,
      {
        headers: authorization,
      },
    );
    expect((await missing.json()).users).toEqual([]);
  });

  it('blocks API routes without a development mock instead of bypassing to the backend', async () => {
    const response = await fetch(`${baseUrl}/activities/realtime`);

    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({
      detail: expect.stringContaining('chamada real bloqueada'),
    });
  });
  it('valida data, oferece agregação sem ranking e status separado de inatividade', async () => {
    const authorization = await demoAuthorization();
    const invalidDate = await fetch(`${baseUrl}/dashboard/attendance?date=2026-02-31`, {
      headers: authorization,
    });
    expect(invalidDate.status).toBe(422);

    const hours = await fetch(
      `${baseUrl}/dashboard/task-hours?start_date=2026-10-01&end_date=2026-10-13`,
      { headers: authorization },
    );
    expect(await hours.json()).toEqual({
      start_date: '2026-10-01',
      end_date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      tasks: [],
    });

    const taskSummary = await fetch(
      `${baseUrl}/dashboard/tasks-summary?date=2026-10-13&task_id=6e7b94da-5651-46a0-bf28-fcb8f4f14c04`,
      { headers: authorization },
    );
    expect(await taskSummary.json()).toEqual({
      date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      tasks: [],
    });

    const agents = await fetch(`${baseUrl}/agents/status`, { headers: authorization });
    const body = await agents.json();
    expect(
      body.agents.map(({ username, connection_status }) => [username, connection_status]),
    ).toEqual([
      ['ana', 'online'],
      ['bruno', 'unknown'],
    ]);
    expect(body.agents[0]).not.toHaveProperty('is_idle');
    const filtered = await fetch(`${baseUrl}/agents/status?username=ana`, {
      headers: authorization,
    });
    expect((await filtered.json()).agents.map(({ username }) => username)).toEqual(['ana']);

    const noMatch = await fetch(`${baseUrl}/agents/status?username=unknown`, {
      headers: authorization,
    });
    expect((await noMatch.json()).agents).toEqual([]);
  });
});
