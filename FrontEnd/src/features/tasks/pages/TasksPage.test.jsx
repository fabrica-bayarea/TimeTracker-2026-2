import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TasksPage } from './TasksPage';

const task = {
  id: '6e7b94da-5651-46a0-bf28-fcb8f4f14c04',
  description: 'Revisar relatório',
  created_at: '2026-10-13T14:20:00Z',
  updated_at: '2026-10-13T14:20:00Z',
};

describe('TasksPage', () => {
  it('mantém indisponibilidade informativa sem mocks e sem chamadas', () => {
    const devApi = { tasks: vi.fn(), createTask: vi.fn() };
    render(<TasksPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toBeInTheDocument();
    expect(
      screen.getByText(/backend ainda não oferece consulta ou persistência de tasks/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(devApi.tasks).not.toHaveBeenCalled();
  });

  it('mostra vazio e cria uma Task quando os mocks estão habilitados', async () => {
    const devApi = {
      tasks: vi.fn().mockResolvedValue([]),
      createTask: vi.fn().mockResolvedValue(task),
    };
    render(<TasksPage devApi={devApi} />);
    expect(await screen.findByText(/Nenhuma Task foi criada/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Revisar relatório' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Task' }));
    expect(await screen.findByText('Revisar relatório')).toBeInTheDocument();
    expect(screen.getByText('Task criada em dados simulados.')).toBeInTheDocument();
    expect(devApi.createTask).toHaveBeenCalledWith('Revisar relatório', expect.any(AbortSignal));
  });

  it('exibe erro de consulta e oferece retry', async () => {
    const devApi = {
      tasks: vi
        .fn()
        .mockRejectedValueOnce(new Error('Serviço indisponível'))
        .mockResolvedValue([task]),
      createTask: vi.fn(),
    };
    render(<TasksPage devApi={devApi} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByText('Revisar relatório')).toBeInTheDocument());
    expect(devApi.tasks).toHaveBeenCalledTimes(2);
  });

  it('anuncia carregamento e rejeita descrição vazia no formulário', async () => {
    let finish;
    const devApi = {
      tasks: vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
      createTask: vi.fn(),
    };
    render(<TasksPage devApi={devApi} />);
    expect(screen.getByRole('status', { name: 'Carregando Tasks…' })).toBeInTheDocument();
    await waitFor(() => expect(finish).toBeDefined());
    await act(async () => finish([]));
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma descrição');
    expect(devApi.createTask).not.toHaveBeenCalled();
  });

  it('pesquisa, ordena e seleciona Task somente para consultar detalhes', async () => {
    const user = userEvent.setup();
    const tasks = [
      task,
      {
        ...task,
        id: '7e7b94da-5651-46a0-bf28-fcb8f4f14c04',
        description: 'Criar orçamento',
        created_at: '2026-10-14T14:20:00Z',
      },
    ];
    const devApi = { tasks: vi.fn().mockResolvedValue(tasks), createTask: vi.fn() };
    render(<TasksPage devApi={devApi} />);

    expect(await screen.findByText('2 resultados')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar Tasks por descrição' }), {
      target: { value: 'RELATÓRIO' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('1 resultado');
    expect(
      screen.getByRole('button', { name: 'Ver detalhes da Task: Revisar relatório' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar pesquisa' }));
    fireEvent.change(screen.getByLabelText('Ordenar Tasks'), {
      target: { value: 'description-asc' },
    });
    const list = screen.getByRole('list');
    expect(
      within(list)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Ver detalhes da Task: Criar orçamento', 'Ver detalhes da Task: Revisar relatório']);

    screen.getByRole('button', { name: 'Ver detalhes da Task: Revisar relatório' }).focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Task selecionada para consulta' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Não inicia nem associa monitoramento/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Task selecionada: Revisar relatório' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(devApi.createTask).not.toHaveBeenCalled();
  });

  it('mostra estado vazio quando a pesquisa não encontra Tasks', async () => {
    const devApi = { tasks: vi.fn().mockResolvedValue([task]), createTask: vi.fn() };
    render(<TasksPage devApi={devApi} />);
    await screen.findByText('Revisar relatório');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar Tasks por descrição' }), {
      target: { value: 'não existe' },
    });
    expect(screen.getByText('Nenhuma Task corresponde à pesquisa.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 resultados');
  });
});
