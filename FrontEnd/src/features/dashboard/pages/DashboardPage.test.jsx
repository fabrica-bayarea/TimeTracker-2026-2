import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { useDashboardData } from '../hooks/useDashboardData';

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
  it('não exibe o card de associação indisponível na apresentação do MVP', () => {
    useDashboardData.mockReturnValue({ data: fullData, loading: false, refresh: vi.fn() });
    render(<DashboardPage />);

    expect(screen.queryByRole('heading', { name: 'Código de associação' })).not.toBeInTheDocument();
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
