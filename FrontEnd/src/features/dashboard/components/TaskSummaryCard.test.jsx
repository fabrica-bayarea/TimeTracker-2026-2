import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskSummaryCard } from './TaskSummaryCard';

const summary = {
  date: '2026-10-13',
  timezone: 'America/Sao_Paulo',
  tasks: [
    {
      task_id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
      title: 'Relatório mensal',
      total_seconds: 3600,
      collaborators: [
        {
          id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
          username: 'ana',
          full_name: 'Ana Souza',
        },
      ],
    },
    {
      task_id: null,
      title: 'Sem Task / Atividades Gerais',
      total_seconds: 1800,
      collaborators: [],
    },
  ],
};

describe('TaskSummaryCard', () => {
  it('não exibe valores nem gráficos enquanto o Backend não fornece task_id', () => {
    render(<TaskSummaryCard />);
    expect(screen.getByRole('heading', { name: 'Tempo por Task' })).toBeInTheDocument();
    expect(screen.getByText(/API ainda não fornece agregações reais/)).toBeInTheDocument();
    expect(screen.queryByText('1h 00min')).not.toBeInTheDocument();
  });

  it('apresenta dados simulados por Task e mantém atividade geral separada', () => {
    render(
      <TaskSummaryCard
        demo
        date={summary.date}
        summary={summary}
        selectedTaskId=""
        loading={false}
      />,
    );
    expect(screen.getByText(/Resumo simulado.*não representa atividade real/)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Horas simuladas por Task' })).toBeInTheDocument();
    expect(screen.getByText('Relatório mensal')).toBeInTheDocument();
    expect(screen.getByText('Sem Task / Atividades Gerais')).toBeInTheDocument();
    expect(screen.getByText('1h 00min')).toBeInTheDocument();
    expect(screen.getByText('0h 30min')).toBeInTheDocument();
    expect(
      screen.getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow')),
    ).toEqual(['100', '50']);
    expect(screen.getByText(/Colaboradores: Ana Souza/)).toBeInTheDocument();
    expect(screen.getByText(/Atividade geral sem Task/)).toBeInTheDocument();
    expect(screen.getByText(/Nenhum ranking é calculado/)).toBeInTheDocument();
    expect(screen.queryByText(/Total consolidado:/)).not.toBeInTheDocument();
  });

  it('apresenta um resumo fornecido pela API sem identificá-lo como demonstração', () => {
    render(<TaskSummaryCard date={summary.date} summary={summary} />);

    expect(screen.getByText('Resumo da API · 2026-10-13')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Horas por Task' })).toBeInTheDocument();
    expect(screen.getByText('Relatório mensal')).toBeInTheDocument();
    expect(screen.getByText('Sem Task / Atividades Gerais')).toBeInTheDocument();
    expect(screen.getByText('1h 00min')).toBeInTheDocument();
    expect(screen.getByText(/Colaboradores: Ana Souza/)).toBeInTheDocument();
    expect(screen.queryByText(/não representa atividade real/)).not.toBeInTheDocument();
    expect(screen.queryByText(/API ainda não fornece/)).not.toBeInTheDocument();
  });

  it('preserva uma Task válida com duração zero sem convertê-la em ausência de dados', () => {
    render(
      <TaskSummaryCard
        demo
        date={summary.date}
        summary={{
          ...summary,
          tasks: [
            {
              task_id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
              title: 'Task sem duração',
              total_seconds: 0,
              collaborators: [],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Task sem duração')).toBeInTheDocument();
    expect(screen.getByText('0h 00min')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/Resumo simulado.*não representa atividade real/)).toBeInTheDocument();
  });

  it('distingue lista vazia, erro e carregamento com retry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TaskSummaryCard demo date={summary.date} loading />);
    expect(screen.getByRole('status', { name: 'Carregando resumo por Task…' })).toBeInTheDocument();

    rerender(<TaskSummaryCard demo date={summary.date} summary={{ ...summary, tasks: [] }} />);
    expect(screen.getByText(/Não há dados simulados de atividade por Task/)).toBeInTheDocument();

    rerender(
      <TaskSummaryCard demo date={summary.date} error="Serviço indisponível" onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Serviço indisponível');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('mostra carregamento, erro recuperável e ausência de dados da API separadamente', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TaskSummaryCard loading />);
    expect(screen.getByRole('status', { name: 'Carregando resumo por Task…' })).toBeInTheDocument();
    expect(screen.queryByText(/API ainda não fornece/)).not.toBeInTheDocument();

    rerender(<TaskSummaryCard error="API respondeu 500" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('API respondeu 500');
    expect(screen.queryByText(/API não retornou atividades/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<TaskSummaryCard summary={{ ...summary, tasks: [] }} />);
    expect(
      screen.getByText('A API não retornou atividades por Task para esta data.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
