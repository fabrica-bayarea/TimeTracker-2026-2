import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../shared/api/api';
import { CollaboratorsPage } from './CollaboratorsPage';

vi.mock('../../../shared/api/api', () => ({ api: { users: vi.fn(), realtime: vi.fn() } }));

const users = [
  { username: 'ana', full_name: 'Ana Souza', department: 'Produto' },
  { username: 'bia', full_name: '', department: '' },
];
const realtime = [{ username: 'ana', status: 'online', process_name: 'Editor' }];

beforeEach(() => vi.resetAllMocks());

describe('CollaboratorsPage', () => {
  it('combina as duas fontes nos cards e na tabela', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockResolvedValue(realtime);
    render(<CollaboratorsPage />);

    expect(api.users).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(api.realtime.mock.calls[0][0]).toBe(api.users.mock.calls[0][0]);
    expect(screen.getByRole('status', { name: 'Carregando colaboradores…' })).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: 'Usuários cadastrados na API' });
    const anaRow = within(table).getByRole('rowheader', { name: 'ana' }).closest('tr');
    const biaRow = within(table).getByRole('rowheader', { name: 'bia' }).closest('tr');
    expect(anaRow).toHaveTextContent('Ana Souza');
    expect(anaRow).toHaveTextContent('Online');
    expect(anaRow).toHaveTextContent('Editor');
    expect(biaRow).toHaveTextContent('Sem dados');

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Ana Souza')).toBeInTheDocument();
    expect(cards[0]).toHaveTextContent('Editor');
    expect(cards[1]).toHaveTextContent('Sem dados');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exibe offline retornado pela API sem rejeitar a atividade', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockResolvedValue([
      { username: 'ana', status: 'offline', seconds_since_last_activity: 901 },
    ]);
    render(<CollaboratorsPage />);

    const table = await screen.findByRole('table', { name: 'Usuários cadastrados na API' });
    const anaRow = within(table).getByRole('rowheader', { name: 'ana' }).closest('tr');
    expect(anaRow).toHaveTextContent('Offline (API)');
    expect(anaRow).not.toHaveTextContent('Indisponível');
  });

  it('combina pesquisa, estado e aplicativo, mostra contagem e limpa os filtros', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockResolvedValue([
      {
        username: 'ana',
        status: 'online',
        process_name: 'Editor',
        seconds_since_last_activity: 20,
      },
      {
        username: 'bia',
        status: 'offline',
        process_name: 'Chrome',
        seconds_since_last_activity: 901,
      },
    ]);
    render(<CollaboratorsPage />);

    const table = await screen.findByRole('table', { name: 'Usuários cadastrados na API' });
    expect(screen.getByText(/2 de 2 colaboradores/)).toBeInTheDocument();
    expect(table).toHaveTextContent('20s atrás');
    expect(table).toHaveTextContent('15min atrás');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar colaborador' }), {
      target: { value: 'BIA' },
    });
    fireEvent.change(screen.getByLabelText('Estado informado pela API'), {
      target: { value: 'offline' },
    });
    fireEvent.change(screen.getByLabelText('Aplicativo na última leitura'), {
      target: { value: 'Chrome' },
    });
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'oldest' } });

    expect(screen.getByText(/1 de 2 colaboradores/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('bia');
    expect(screen.getByRole('table')).not.toHaveTextContent('ana');

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText(/2 de 2 colaboradores/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('ana');
    expect(screen.getByRole('table')).toHaveTextContent('bia');
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('name');
  });

  it('permite restaurar a ordenação padrão mesmo sem critérios de filtro', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockResolvedValue(realtime);
    render(<CollaboratorsPage />);
    await screen.findByRole('table', { name: 'Usuários cadastrados na API' });

    const clearButton = screen.getByRole('button', { name: 'Limpar filtros' });
    expect(clearButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'recent' } });
    expect(clearButton).toBeEnabled();
    fireEvent.click(clearButton);
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('name');
    expect(clearButton).toBeDisabled();
  });

  it('separa a recepção da consulta da idade da última leitura e envelhece sem novo pedido', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    try {
      api.users.mockResolvedValue(users);
      api.realtime.mockResolvedValue([
        {
          username: 'ana',
          status: 'online',
          process_name: 'Editor',
          seconds_since_last_activity: 20,
        },
      ]);
      render(<CollaboratorsPage />);

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByRole('table')).toHaveTextContent('20s atrás');
      expect(screen.getByRole('status', { name: 'Atualização da consulta' })).toHaveTextContent(
        'Última atualização da consulta: 16/10/2026, 09:00',
      );

      await act(async () => vi.advanceTimersByTime(60_000));
      expect(screen.getByRole('table')).toHaveTextContent('1min atrás');
      expect(api.realtime).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('identifica resposta parcial e não inventa horário de atualização em uma falha total', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockRejectedValue(new Error('atividade indisponível'));
    render(<CollaboratorsPage />);

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Atualização da consulta' })).toHaveTextContent(
        'Resposta parcial da consulta recebida',
      ),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Atividade: atividade indisponível');

    api.users.mockRejectedValue(new Error('API indisponível'));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Atualização da consulta' })).toHaveTextContent(
        'Falha na atualização atual. Última resposta válida recebida em',
      ),
    );
  });

  it('permite atualização manual sem criar chamadas duplicadas', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockResolvedValue(realtime);
    render(<CollaboratorsPage />);
    await screen.findByRole('table', { name: 'Usuários cadastrados na API' });

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() => expect(api.users).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(api.realtime).toHaveBeenCalledTimes(2));
    expect(api.users.mock.calls[0][0].aborted).toBe(true);
    expect(api.users.mock.calls[1][0].aborted).toBe(false);
  });

  it('filtra por indisponibilidade sem apresentar falha de realtime como offline', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockRejectedValue(new Error('rede indisponível'));
    render(<CollaboratorsPage />);

    await screen.findByRole('table', { name: 'Usuários cadastrados na API' });
    fireEvent.change(screen.getByLabelText('Estado informado pela API'), {
      target: { value: 'unavailable' },
    });
    expect(screen.getByText(/2 de 2 colaboradores/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Indisponível');
    expect(screen.getByRole('table')).not.toHaveTextContent('Offline (API)');
  });

  it('mantém usuários visíveis quando a atividade falha, sem sugerir estado offline', async () => {
    api.users.mockResolvedValue(users);
    api.realtime.mockRejectedValue(new Error('rede indisponível'));
    render(<CollaboratorsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Atividade: rede indisponível');
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Indisponível')).toHaveLength(2);
    expect(within(table).queryByText('Offline (API)')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('informa lista indisponível quando usuários falham mesmo com atividade disponível', async () => {
    api.users.mockRejectedValue(new Error('API respondeu 503'));
    api.realtime.mockResolvedValue(realtime);
    render(<CollaboratorsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuários: API respondeu 503');
    expect(screen.getByText('Lista indisponível.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('reúne as duas falhas em um aviso com opção de retry', async () => {
    api.users.mockRejectedValue(new Error('usuários offline'));
    api.realtime.mockRejectedValue(new Error('atividade offline'));
    render(<CollaboratorsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Usuários: usuários offline; Atividade: atividade offline');
    expect(within(alert).getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    expect(screen.getByText('Lista indisponível.')).toBeInTheDocument();
  });

  it('distingue uma lista vazia válida de erro de leitura', async () => {
    api.users.mockResolvedValue([]);
    api.realtime.mockResolvedValue([]);
    render(<CollaboratorsPage />);

    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('repete as duas consultas e recupera a lista após uma falha', async () => {
    api.users
      .mockRejectedValueOnce(new Error('temporariamente offline'))
      .mockResolvedValueOnce(users);
    api.realtime.mockResolvedValueOnce(realtime).mockResolvedValueOnce(realtime);
    render(<CollaboratorsPage />);

    fireEvent.click(
      within(await screen.findByRole('alert')).getByRole('button', { name: 'Tentar novamente' }),
    );
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('table')).toHaveTextContent('Ana Souza');
    expect(api.users).toHaveBeenCalledTimes(2);
    expect(api.realtime).toHaveBeenCalledTimes(2);
  });

  it('cancela ambas as leituras pendentes ao desmontar', () => {
    api.users.mockImplementation(() => new Promise(() => {}));
    api.realtime.mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(<CollaboratorsPage />);

    const usersSignal = api.users.mock.calls[0][0];
    const realtimeSignal = api.realtime.mock.calls[0][0];
    expect(usersSignal).toBe(realtimeSignal);
    expect(usersSignal.aborted).toBe(false);
    unmount();
    expect(usersSignal.aborted).toBe(true);
  });

  it('ignora resposta antiga mesmo quando a fonte ignora o cancelamento', async () => {
    const pending = [];
    api.users.mockRejectedValueOnce(new Error('offline')).mockImplementation(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    api.realtime.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
    render(<CollaboratorsPage />);

    const retry = within(await screen.findByRole('alert')).getByRole('button', {
      name: 'Tentar novamente',
    });
    act(() => {
      retry.click();
      retry.click();
    });
    expect(pending).toHaveLength(2);
    expect(api.users.mock.calls[1][0].aborted).toBe(true);
    await act(async () => pending[1]([{ username: 'nova', full_name: 'Nova' }]));
    expect(screen.getByRole('table')).toHaveTextContent('Nova');
    await act(async () => pending[0]([{ username: 'antiga', full_name: 'Antiga' }]));
    expect(screen.getByRole('table')).toHaveTextContent('Nova');
    expect(screen.getByRole('table')).not.toHaveTextContent('Antiga');
  });
});
