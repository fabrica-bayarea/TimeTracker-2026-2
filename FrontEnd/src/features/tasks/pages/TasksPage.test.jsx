import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksPage } from './TasksPage';
import { api } from '../../../shared/api/api';

vi.mock('../../../shared/api/api', () => ({
  api: {
    tasks: vi.fn(),
    users: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.tasks.mockResolvedValue([
    {
      id: 'task-1',
      title: 'Configurar servidor',
      description: 'Deploy em produção',
      status: 'pending',
      assigned_users: [{ id: 'user-1', username: 'carlos' }],
    },
  ]);
  api.users.mockResolvedValue([
    { id: 'user-1', username: 'carlos', full_name: 'Carlos Silva' },
  ]);
});

describe('TasksPage', () => {
  it('renderiza o cabeçalho e lista as tarefas da equipe', async () => {
    render(<TasksPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByText('Configurar servidor')).toBeInTheDocument();
    expect(screen.getAllByText('Pendente').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('1 colaborador')).toBeInTheDocument();
  });

  it('abre o modal de criação de task ao clicar no botão', async () => {
    render(<TasksPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Task' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Nova Task' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título da tarefa/i)).toBeInTheDocument();
  });

  it('permite submeter uma nova task', async () => {
    api.createTask.mockResolvedValue({
      id: 'task-2',
      title: 'Nova feature',
      description: '',
      status: 'pending',
      assigned_users: [],
    });

    render(<TasksPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Task' }));
    fireEvent.change(screen.getByLabelText(/Título da tarefa/i), {
      target: { value: 'Nova feature' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar task' }));

    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nova feature',
        }),
      );
    });
  });
});
