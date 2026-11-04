import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskProductivityCard } from './TaskProductivityCard';

const metrics = {
  task_id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  title: 'Relatório mensal',
  registered_seconds: 14400,
  productive_seconds: 11400,
};

describe('TaskProductivityCard', () => {
  it('mantém a métrica produtiva indisponível sem contrato real', () => {
    render(<TaskProductivityCard />);
    expect(
      screen.getByRole('heading', { name: 'Tempo registrado e produtivo' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/is_idle/)).toBeInTheDocument();
    expect(screen.queryByText('4h 00min')).not.toBeInTheDocument();
  });

  it('apresenta dois valores válidos para a mesma Task, incluindo zero, sem percentual', () => {
    render(<TaskProductivityCard available metrics={{ ...metrics, productive_seconds: 0 }} />);
    expect(screen.getByText('4h 00min')).toBeInTheDocument();
    expect(screen.getByText('0h 00min')).toBeInTheDocument();
    expect(
      screen.getByText(/sem percentual ou comparação entre colaboradores/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('recusa resposta inválida ou associada a outra Task', () => {
    const { rerender } = render(
      <TaskProductivityCard
        available
        selectedTaskId={metrics.task_id}
        metrics={{ ...metrics, productive_seconds: -1 }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('resposta de produtividade é inválida');
    rerender(
      <TaskProductivityCard
        available
        selectedTaskId="d94a4d6c-8542-4c3e-889b-89db302ef4cc"
        metrics={metrics}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Task selecionada');
    expect(screen.queryByText('4h 00min')).not.toBeInTheDocument();
  });

  it('distingue carregamento, erro e ausência de métricas', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TaskProductivityCard loading />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Carregando métricas de produtividade…',
    );
    rerender(<TaskProductivityCard error="API 500" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<TaskProductivityCard available metrics={null} />);
    expect(screen.getByText(/Não há métricas para a Task/)).toBeInTheDocument();
  });
});
