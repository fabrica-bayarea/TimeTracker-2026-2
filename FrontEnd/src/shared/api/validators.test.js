import { describe, expect, it } from 'vitest';
import {
  validManager,
  validManagerToken,
  validJwtAccessToken,
  validAgentStatuses,
  validAttendance,
  validRealtime,
  validSettings,
  validSummary,
  validTask,
  validTaskDescription,
  validTaskHours,
  validTasks,
  validUsers,
} from './validators';

const ACCESS_TOKEN = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;

describe('contratos da API', () => {
  it('aceita usuários únicos e campos opcionais ausentes ou nulos', () => {
    expect(validUsers([])).toBe(true);
    expect(validUsers([{ username: 'ana', full_name: null, department: 'TI' }])).toBe(true);
    expect(validUsers([{ username: 'ana' }, { username: 'ana' }])).toBe(false);
    expect(validUsers([{ username: '' }])).toBe(false);
    expect(validUsers([{ username: 'ana', full_name: {} }])).toBe(false);
    expect(validUsers([{ username: 'ana', department: [] }])).toBe(false);
    expect(validUsers(null)).toBe(false);
  });

  it('exige estado e segundos inteiros seguros nas leituras realtime', () => {
    const entry = { username: 'ana', status: 'online', seconds_since_last_activity: 0 };
    expect(validRealtime([entry])).toBe(true);
    expect(validRealtime([{ ...entry, status: 'ausente', process_name: null }])).toBe(true);
    expect(validRealtime([{ ...entry, status: 'offline' }])).toBe(true);
    expect(validRealtime([entry, entry])).toBe(false);
    expect(validRealtime([{ ...entry, status: 'desconhecido' }])).toBe(false);
    expect(validRealtime([{ ...entry, seconds_since_last_activity: -1 }])).toBe(false);
    expect(validRealtime([{ ...entry, seconds_since_last_activity: 0.5 }])).toBe(false);
    expect(validRealtime([{ ...entry, process_name: {} }])).toBe(false);
    expect(validRealtime([{ ...entry, is_idle: true }])).toBe(true);
    expect(validRealtime([{ ...entry, is_idle: 'false' }])).toBe(false);
  });

  it('valida data real, identidades e duração por categoria no resumo', () => {
    const user = {
      username: 'ana',
      total_seconds: 60,
      by_category: [{ category: 'Trabalho', total_seconds: 60 }],
    };
    expect(validSummary({ date: '2026-09-25', users: [] })).toBe(true);
    expect(validSummary({ date: '2026-09-25', users: [user] })).toBe(true);
    expect(validSummary({ date: '2026-02-31', users: [] })).toBe(false);
    expect(validSummary({ date: '2026-09-25', users: [user, user] })).toBe(false);
    expect(validSummary({ date: '2026-09-25', users: [{ ...user, username: '' }] })).toBe(false);
    expect(
      validSummary({
        date: '2026-09-25',
        users: [{ ...user, total_seconds: Number.MAX_SAFE_INTEGER + 1 }],
      }),
    ).toBe(false);
    expect(
      validSummary({
        date: '2026-09-25',
        users: [{ ...user, by_category: [{ category: 'Trabalho', total_seconds: -1 }] }],
      }),
    ).toBe(false);
    expect(
      validSummary({
        date: '2026-09-25',
        users: [{ ...user, by_category: [{ ...user.by_category[0], color: {} }] }],
      }),
    ).toBe(false);
    expect(validSummary(null)).toBe(false);
  });

  it('exige ambos os parâmetros globais inteiros positivos', () => {
    const settings = { capture_interval_seconds: 10, idle_timeout_seconds: 300 };
    expect(validSettings(settings)).toBe(true);
    expect(validSettings({ ...settings, capture_interval_seconds: 0 })).toBe(false);
    expect(validSettings({ ...settings, idle_timeout_seconds: 1.5 })).toBe(false);
    expect(validSettings({ ...settings, idle_timeout_seconds: '300' })).toBe(false);
    expect(validSettings({ capture_interval_seconds: 10 })).toBe(false);
    expect(validSettings({ ...settings, updated_at: '2026-10-16T12:00:00Z' })).toBe(true);
    expect(validSettings({ ...settings, updated_at: 42 })).toBe(false);
    expect(validSettings(null)).toBe(false);
  });

  it('validates ManagerOut without accepting password fields', () => {
    const manager = {
      id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
      email: 'gestor@empresa.com',
      created_at: '2026-10-13T12:00:00Z',
    };
    expect(validManager(manager)).toBe(true);
    expect(validManager({ ...manager, password_hash: 'hash' })).toBe(false);
    expect(validManager({ ...manager, password: 'segredo' })).toBe(false);
    expect(validManager({ ...manager, association_code: '012345' })).toBe(false);
    expect(validManager({ ...manager, email: null })).toBe(false);
    expect(validManager({ ...manager, id: 'not-a-uuid' })).toBe(false);
    expect(validManager({ ...manager, created_at: 'ontem' })).toBe(false);
  });

  it('validates bearer token and positive expiry in seconds', () => {
    const token = {
      access_token: ACCESS_TOKEN,
      token_type: 'bearer',
      expires_in: 3600,
    };
    expect(validManagerToken(token)).toBe(true);
    expect(validManagerToken({ ...token, token_type: 'Bearer' })).toBe(false);
    expect(validManagerToken({ ...token, expires_in: 0 })).toBe(false);
    expect(validManagerToken({ ...token, expires_in: 1.5 })).toBe(false);
    expect(validManagerToken({ ...token, access_token: '' })).toBe(false);
    expect(validManagerToken({ ...token, access_token: 'header.payload' })).toBe(false);
    expect(validManagerToken({ ...token, access_token: 'header.payload.signature\n' })).toBe(false);
    expect(validManagerToken({ ...token, password: 'nao-incluir' })).toBe(false);
  });

  it('validates only the compact JWT token shape without verifying its signature', () => {
    expect(validJwtAccessToken(ACCESS_TOKEN)).toBe(true);
    expect(validJwtAccessToken('')).toBe(false);
    expect(validJwtAccessToken(null)).toBe(false);
    expect(validJwtAccessToken(' header.payload.signature')).toBe(false);
    expect(validJwtAccessToken('header.payload.signature\r\nX-Injected: yes')).toBe(false);
    expect(validJwtAccessToken('header.payload')).toBe(false);
    expect(validJwtAccessToken('header..signature')).toBe(false);
    expect(validJwtAccessToken('a.b.c')).toBe(false);
  });

  it('valida Task, descrição obrigatória, UUID e instantes com fuso', () => {
    const task = {
      id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      description: 'Revisar relatório',
      created_at: '2026-10-13T14:20:00Z',
      updated_at: '2026-10-13T14:20:00Z',
    };
    expect(validTaskDescription('  Revisar relatório  ')).toBe(true);
    expect(validTaskDescription(' ')).toBe(false);
    expect(validTaskDescription('x'.repeat(201))).toBe(false);
    expect(validTaskDescription(null)).toBe(false);
    expect(validTask(task)).toBe(true);
    expect(validTasks([task])).toBe(true);
    expect(validTasks([task, task])).toBe(false);
    expect(validTask({ ...task, id: 'inválido' })).toBe(false);
    expect(validTask({ ...task, updated_at: '2026-10-13T14:20:00' })).toBe(false);
    expect(validTask({ ...task, unexpected: true })).toBe(false);
    expect(validTasks(null)).toBe(false);
  });

  it('valida jornada com America/Sao_Paulo, horários nulos ou instantes explícitos', () => {
    const attendance = {
      date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      as_of: '2026-10-13T19:50:00Z',
      users: [
        {
          username: 'ana',
          first_activity_at: '2026-10-13T11:15:00Z',
          last_activity_at: '2026-10-13T20:42:00Z',
        },
        { username: 'bruno', first_activity_at: null, last_activity_at: null },
      ],
    };
    expect(validAttendance(attendance)).toBe(true);
    expect(
      validAttendance({
        ...attendance,
        users: [{ ...attendance.users[0], first_activity_at: '2026-10-13T02:59:59Z' }],
      }),
    ).toBe(false);
    expect(
      validAttendance({
        ...attendance,
        users: [{ ...attendance.users[0], last_activity_at: '2026-10-13T03:10:00Z' }],
      }),
    ).toBe(false);
    expect(
      validAttendance({
        ...attendance,
        users: [{ ...attendance.users[0], last_activity_at: null }],
      }),
    ).toBe(false);
    expect(validAttendance({ ...attendance, date: '2026-02-31' })).toBe(false);
    expect(validAttendance({ ...attendance, timezone: 'UTC' })).toBe(false);
    expect(
      validAttendance({ ...attendance, users: [...attendance.users, attendance.users[0]] }),
    ).toBe(false);
    expect(
      validAttendance({
        ...attendance,
        users: [{ ...attendance.users[0], first_activity_at: '2026-10-13T11:15:00' }],
      }),
    ).toBe(false);
    expect(validAttendance(null)).toBe(false);
  });

  it('valida horas por Task e conexão do Agent sem confundir is_idle', () => {
    const taskId = '6e7b94da-5651-46a0-bf28-fcb8f4f14c04';
    const hours = {
      start_date: '2026-10-01',
      end_date: '2026-10-13',
      timezone: 'America/Sao_Paulo',
      tasks: [{ task_id: taskId, description: 'Revisar relatório', total_seconds: 3600 }],
    };
    const statuses = {
      agents: [
        {
          username: 'ana',
          hostname: 'ESTACAO-01',
          last_record_at: '2026-10-13T20:42:00Z',
          connection_status: 'online',
        },
        {
          username: 'bruno',
          hostname: 'ESTACAO-02',
          last_record_at: null,
          connection_status: 'unknown',
        },
      ],
    };
    expect(validTaskHours(hours)).toBe(true);
    expect(validTaskHours({ ...hours, start_date: '2026-10-14' })).toBe(false);
    expect(validTaskHours({ ...hours, tasks: [{ ...hours.tasks[0], total_seconds: -1 }] })).toBe(
      false,
    );
    expect(validAgentStatuses(statuses)).toBe(true);
    expect(validAgentStatuses({ agents: [...statuses.agents, statuses.agents[0]] })).toBe(false);
    expect(
      validAgentStatuses({
        agents: [{ ...statuses.agents[0], connection_status: 'offline', is_idle: true }],
      }),
    ).toBe(true);
    expect(
      validAgentStatuses({ agents: [{ ...statuses.agents[0], connection_status: 'ausente' }] }),
    ).toBe(false);
    expect(validAgentStatuses(null)).toBe(false);
  });
});
