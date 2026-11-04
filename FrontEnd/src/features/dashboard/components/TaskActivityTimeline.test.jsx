import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskActivityTimeline } from './TaskActivityTimeline';

const taskId = '6e7b94da-5651-46a0-bf28-fcb8f4f14c04';
const timeline = {
  task_id: taskId,
  events: [
    {
      id: 'd94a4d6c-8542-4c3e-889b-89db302ef4cc',
      username: 'ana',
      process_name: 'Browser.exe',
      window_title: 'Private title is not displayed',
      captured_at: '2026-11-04T13:00:00-03:00',
      duration_seconds: 900,
      is_idle: false,
    },
    {
      id: 'b50c6ae9-531b-4fa7-9cf7-b7e05e741acc',
      username: 'bia',
      process_name: 'Code.exe',
      captured_at: '2026-11-04T12:00:00-03:00',
      duration_seconds: 0,
      is_idle: true,
    },
  ],
};

describe('TaskActivityTimeline', () => {
  it('mostra indisponibilidade da API sem inventar eventos', () => {
    render(<TaskActivityTimeline selectedTaskId={taskId} date="2026-11-04" username="ana" />);
    expect(screen.getByRole('heading', { name: 'Linha do tempo da Task' })).toBeInTheDocument();
    expect(screen.getByText(/API não fornece consulta cronológica/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('ordena eventos, exibe aplicação, colaborador, instante, duração e inatividade', () => {
    render(
      <TaskActivityTimeline
        available
        data={timeline}
        selectedTaskId={taskId}
        selectedTaskTitle="Relatório mensal"
        date="2026-11-04"
      />,
    );
    const list = screen.getByRole('list', { name: 'Eventos em ordem cronológica' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Code.exe');
    expect(items[0]).toHaveTextContent('bia');
    expect(items[0]).toHaveTextContent('0h 00min');
    expect(items[0]).toHaveTextContent('Inatividade registrada');
    expect(items[1]).toHaveTextContent('Browser.exe');
    expect(items[1]).toHaveTextContent('ana');
    expect(items[1]).toHaveTextContent('15min');
    expect(screen.queryByText('Private title is not displayed')).not.toBeInTheDocument();
    expect(screen.getAllByRole('time')).toHaveLength(2);
  });

  it('trata lista vazia, carregamento, erro, retry e resposta incompatível com Task', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TaskActivityTimeline loading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando linha do tempo…');
    rerender(<TaskActivityTimeline error="API 500" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(
      <TaskActivityTimeline
        available
        data={{ task_id: taskId, events: [] }}
        selectedTaskId={taskId}
      />,
    );
    expect(screen.getByText(/Não há atividades vinculadas/)).toBeInTheDocument();
    rerender(
      <TaskActivityTimeline
        available
        data={timeline}
        selectedTaskId="b50c6ae9-531b-4fa7-9cf7-b7e05e741acc"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('não corresponde à Task selecionada');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('expõe atualização manual somente quando o serviço está disponível', () => {
    const onRetry = vi.fn();
    render(<TaskActivityTimeline available data={timeline} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar linha do tempo' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
