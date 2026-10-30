import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { useDashboardData } from '../hooks/useDashboardData';
import { todayIso } from '../../../shared/lib/date';

vi.mock('../hooks/useDashboardData', () => ({ useDashboardData: vi.fn() }));

const fullData = {
  summary: {
    date: '2026-09-25',
    users: [{ username: 'ana', total_seconds: 3600, by_category: [] }],
  },
  users: [{ username: 'ana', full_name: 'Ana' }],
  realtime: [
    { username: 'ana', status: 'online', seconds_since_last_activity: 5, process_name: 'Editor' },
  ],
  availability: { summary: true, users: true, realtime: true },
};

beforeEach(() => vi.clearAllMocks());

describe('DashboardPage', () => {
  it('não expõe o card de associação sem uma sessão autenticada', () => {
    useDashboardData.mockReturnValue({ data: fullData, loading: false, refresh: vi.fn() });
    render(<DashboardPage />);

    expect(screen.queryByRole('heading', { name: 'Código de associação' })).not.toBeInTheDocument();
  });

  it('exibe o estado pendente do código para o gestor autenticado sem afetar os indicadores', async () => {
    useDashboardData.mockReturnValue({ data: fullData, loading: false, refresh: vi.fn() });
    render(<DashboardPage manager={{ id: 'manager-1' }} associationClient={{}} />);

    expect(screen.getByRole('heading', { name: 'Código de associação' })).toBeInTheDocument();
    expect(await screen.findByRole('note')).toHaveTextContent('sessão');
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('1h 00min');
    expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeDisabled();
  });

  it('renderiza no Dashboard o código retornado por um adapter simulado', async () => {
    const associationClient = {
      getAssociationCode: vi.fn().mockResolvedValue('001234'),
    };
    useDashboardData.mockReturnValue({ data: fullData, loading: false, refresh: vi.fn() });
    render(<DashboardPage manager={{ id: 'manager-1' }} associationClient={associationClient} />);

    expect(await screen.findByText('001234')).toBeInTheDocument();
    expect(associationClient.getAssociationCode).toHaveBeenCalledOnce();
    expect(associationClient.getAssociationCode.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  });

  it('preserva o filtro visível quando a lista de usuários fica indisponível', () => {
    useDashboardData.mockReturnValue({ data: fullData, loading: false, refresh: vi.fn() });
    const { rerender } = render(<DashboardPage />);
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'ana' } });
    useDashboardData.mockReturnValue({
      data: { ...fullData, users: [], availability: { ...fullData.availability, users: false } },
      loading: false,
      error: 'Usuários: offline',
      refresh: vi.fn(),
    });
    rerender(<DashboardPage />);
    expect(screen.getByLabelText('Usuário')).toHaveValue('ana');
    expect(screen.getByRole('option', { name: 'ana (selecionado)' })).toBeInTheDocument();
    expect(useDashboardData.mock.calls.at(-1)[1]).toBe('ana');
  });
  it('mostra carregamento antes da primeira resposta', () => {
    useDashboardData.mockReturnValue({
      data: null,
      loading: true,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);
    expect(screen.getByRole('status', { name: 'Carregando online' })).toBeInTheDocument();
  });

  it('mostra apenas totais e estados fornecidos pela API', () => {
    useDashboardData.mockReturnValue({
      data: fullData,
      loading: false,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('1h 00min');
    expect(
      within(screen.getByLabelText('Indicadores disponíveis'))
        .getByText('Online')
        .closest('article'),
    ).toHaveTextContent('1');
    expect(screen.getAllByText('Editor')).toHaveLength(3);
  });

  it('mostra offline da API e separa usuários sem entrada realtime', () => {
    const data = {
      ...fullData,
      users: [
        { username: 'ana', full_name: 'Ana' },
        { username: 'bia', full_name: 'Bia' },
      ],
      realtime: [{ username: 'ana', status: 'offline', seconds_since_last_activity: 901 }],
    };
    useDashboardData.mockReturnValue({ data, loading: false, refreshing: false, refresh: vi.fn() });

    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);

    expect(screen.getAllByText('Offline (API)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sem dados').length).toBeGreaterThan(0);
    const metrics = within(screen.getByLabelText('Indicadores disponíveis'));
    expect(metrics.getByText('Offline (API)').closest('article')).toHaveTextContent('1');
    expect(metrics.getByText('Sem dados').closest('article')).toHaveTextContent('1');
  });

  it('marca realtime indisponível sem exibir zero', () => {
    useDashboardData.mockReturnValue({
      data: {
        ...fullData,
        realtime: [],
        availability: { ...fullData.availability, realtime: false },
      },
      loading: false,
      refreshing: false,
      error: 'Alguns dados estão temporariamente indisponíveis.',
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);
    expect(
      within(screen.getByLabelText('Indicadores disponíveis'))
        .getByText('Online')
        .closest('article'),
    ).toHaveTextContent('—');
    expect(screen.getByRole('alert')).toHaveTextContent('temporariamente indisponíveis');
  });

  it('aplica o filtro de usuário à consulta', () => {
    useDashboardData.mockReturnValue({
      data: fullData,
      loading: false,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'ana' } });
    expect(useDashboardData.mock.calls.at(-1)[1]).toBe('ana');
  });

  it('combina usuário e aplicativo na última atividade sem alterar os indicadores por aplicativo', () => {
    const data = {
      ...fullData,
      users: [
        { username: 'ana', full_name: 'Ana' },
        { username: 'bia', full_name: 'Bia' },
      ],
      realtime: [
        {
          username: 'ana',
          status: 'online',
          seconds_since_last_activity: 5,
          process_name: 'Editor',
        },
        {
          username: 'bia',
          status: 'online',
          seconds_since_last_activity: 8,
          process_name: 'Chrome',
        },
      ],
      summary: {
        date: '2026-09-25',
        users: [
          { username: 'ana', total_seconds: 3600, by_category: [] },
          { username: 'bia', total_seconds: 3600, by_category: [] },
        ],
      },
    };
    useDashboardData.mockReturnValue({ data, loading: false, refreshing: false, refresh: vi.fn() });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);

    const metrics = screen.getByText('Tempo registrado').closest('article');
    const activity = screen.getByLabelText('Tabela de última atividade com rolagem horizontal');
    expect(metrics).toHaveTextContent('2h 00min');
    expect(activity).toHaveTextContent('Ana');
    expect(activity).toHaveTextContent('Bia');

    fireEvent.change(screen.getByLabelText('Aplicativo na última atividade'), {
      target: { value: 'Chrome' },
    });
    expect(activity).toHaveTextContent('Bia');
    expect(activity).not.toHaveTextContent('Ana');
    expect(metrics).toHaveTextContent('2h 00min');

    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'ana' } });
    expect(
      screen.getByText('Nenhum usuário corresponde aos filtros aplicados.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 de 1 usuários nesta lista');
  });

  it('aplica Task somente ao resumo por Task e deixa os indicadores gerais intactos', async () => {
    const task = {
      id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      title: 'Relatório mensal',
      description: 'Revisar relatório',
      collaborators: [],
      created_at: '2026-10-13T14:20:00Z',
      updated_at: '2026-10-13T14:20:00Z',
    };
    const devApi = {
      tasks: vi.fn().mockResolvedValue([task]),
      taskSummary: vi.fn().mockResolvedValue({
        date: todayIso(),
        timezone: 'America/Sao_Paulo',
        tasks: [
          {
            task_id: task.id,
            title: task.title,
            total_seconds: 1800,
            collaborators: [],
          },
        ],
      }),
    };
    useDashboardData.mockReturnValue({
      data: fullData,
      loading: false,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} devApi={devApi} />);

    const taskFilter = await screen.findByLabelText(/Task \(somente resumo por Task\)/);
    await waitFor(() => expect(taskFilter).toBeEnabled());
    const date = screen.getByLabelText('Data do resumo').value;
    const user = screen.getByLabelText('Usuário').value;
    const originalQuery = useDashboardData.mock.calls.at(-1).slice(0, 2);
    fireEvent.change(taskFilter, { target: { value: task.id } });

    expect(devApi.taskSummary).toHaveBeenLastCalledWith(
      date,
      user,
      task.id,
      expect.any(AbortSignal),
    );
    expect(useDashboardData.mock.calls.at(-1).slice(0, 2)).toEqual(originalQuery);
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('1h 00min');
    expect(await screen.findByText('0h 30min')).toBeInTheDocument();
  });

  it('limpa uma Task removida no refresh e atualiza o resumo sem alterar métricas gerais', async () => {
    const task = {
      id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      title: 'Relatório mensal',
      description: 'Revisar relatório',
      collaborators: [],
      created_at: '2026-10-13T14:20:00Z',
      updated_at: '2026-10-13T14:20:00Z',
    };
    const devApi = {
      tasks: vi.fn().mockResolvedValueOnce([task]).mockResolvedValue([]),
      taskSummary: vi.fn((_date, _username, taskId) =>
        Promise.resolve({
          date: todayIso(),
          timezone: 'America/Sao_Paulo',
          tasks: taskId
            ? [{ task_id: task.id, title: task.title, total_seconds: 1800, collaborators: [] }]
            : [],
        }),
      ),
    };
    useDashboardData.mockReturnValue({
      data: fullData,
      loading: false,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} devApi={devApi} />);

    const taskFilter = await screen.findByLabelText(/Task \(somente resumo por Task\)/);
    await waitFor(() => expect(taskFilter).toBeEnabled());
    fireEvent.change(taskFilter, { target: { value: task.id } });
    await screen.findByText('0h 30min');
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('1h 00min');

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() => expect(taskFilter).toHaveValue(''));
    await waitFor(() => {
      expect(devApi.taskSummary).toHaveBeenLastCalledWith(
        todayIso(),
        '',
        '',
        expect.any(AbortSignal),
      );
    });
    expect(screen.queryByText('0h 30min')).not.toBeInTheDocument();
    expect(screen.getByText('Tempo registrado').closest('article')).toHaveTextContent('1h 00min');
  });

  it('mantém a contagem de usuários cadastrados quando realtime falha', () => {
    useDashboardData.mockReturnValue({
      data: {
        ...fullData,
        realtime: [],
        availability: { ...fullData.availability, realtime: false },
      },
      loading: false,
      refreshing: false,
      refresh: vi.fn(),
    });
    render(<DashboardPage dark={false} toggleTheme={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'ana' } });
    expect(screen.getByText('Usuários cadastrados').closest('article')).toHaveTextContent('1');
    expect(
      within(screen.getByLabelText('Indicadores disponíveis'))
        .getByText('Online')
        .closest('article'),
    ).toHaveTextContent('—');
  });
});
