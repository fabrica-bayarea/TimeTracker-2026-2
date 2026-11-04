import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { todayIso } from '../../../shared/lib/date';
import { DashboardFilters } from './DashboardFilters';

const base = {
  date: '2026-09-20',
  username: 'ana',
  users: [{ username: 'ana', full_name: 'Ana' }],
  usersAvailable: true,
  updatedAt: null,
  refreshing: false,
};

it('altera data e usuário, limpa a seleção e volta para hoje', () => {
  const onDateChange = vi.fn();
  const onUsernameChange = vi.fn();
  render(
    <DashboardFilters {...base} onDateChange={onDateChange} onUsernameChange={onUsernameChange} />,
  );
  fireEvent.change(screen.getByLabelText('Data do resumo'), { target: { value: '2026-09-19' } });
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Limpar usuário' }));
  fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
  expect(onDateChange).toHaveBeenCalledWith('2026-09-19');
  expect(onDateChange).toHaveBeenCalledWith(todayIso());
  expect(onUsernameChange).toHaveBeenCalledWith('');
  expect(screen.getByText('Filtro ativo')).toBeInTheDocument();
});

it('mantém usuário selecionado visível quando a lista fica indisponível', () => {
  render(
    <DashboardFilters
      {...base}
      users={[]}
      usersAvailable={false}
      onDateChange={vi.fn()}
      onUsernameChange={vi.fn()}
    />,
  );
  expect(screen.getByLabelText('Usuário')).toBeDisabled();
  expect(screen.getByRole('option', { name: 'ana (selecionado)' })).toBeInTheDocument();
});

it('combina seleção de Task com filtros sem oferecê-la quando a lista está indisponível', () => {
  const taskId = '6e7b94da-5651-46a0-bf28-fcb8f4f14c04';
  const onTaskChange = vi.fn();
  const { rerender } = render(
    <DashboardFilters
      {...base}
      tasks={[]}
      tasksAvailable={false}
      taskId=""
      onTaskChange={onTaskChange}
      onDateChange={vi.fn()}
      onUsernameChange={vi.fn()}
    />,
  );
  expect(screen.getByLabelText(/Task \(resumo por Task\)/)).toBeDisabled();
  expect(screen.getByRole('option', { name: 'Nenhuma Task disponível' })).toBeInTheDocument();

  rerender(
    <DashboardFilters
      {...base}
      tasks={[{ id: taskId, title: 'Relatório mensal' }]}
      tasksAvailable
      taskId=""
      onTaskChange={onTaskChange}
      onDateChange={vi.fn()}
      onUsernameChange={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText(/Task \(resumo por Task\)/), {
    target: { value: taskId },
  });
  expect(onTaskChange).toHaveBeenCalledWith(taskId);
  rerender(
    <DashboardFilters
      {...base}
      tasks={[{ id: taskId, title: 'Relatório mensal' }]}
      tasksAvailable
      taskId={taskId}
      onTaskChange={onTaskChange}
      onDateChange={vi.fn()}
      onUsernameChange={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Limpar Task' }));
  expect(onTaskChange).toHaveBeenLastCalledWith('');
  expect(screen.getByText(/Não altera os indicadores gerais/)).toBeInTheDocument();
});

it('não mantém uma Task removida como opção enquanto o catálogo está indisponível', () => {
  render(
    <DashboardFilters
      {...base}
      tasks={[]}
      tasksAvailable={false}
      tasksError="Catálogo indisponível"
      taskId="6e7b94da-5651-46a0-bf28-fcb8f4f14c04"
      onTaskChange={vi.fn()}
      onDateChange={vi.fn()}
      onUsernameChange={vi.fn()}
    />,
  );

  expect(screen.getByRole('option', { name: 'Lista de Tasks indisponível' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Task selecionada' })).not.toBeInTheDocument();
});
