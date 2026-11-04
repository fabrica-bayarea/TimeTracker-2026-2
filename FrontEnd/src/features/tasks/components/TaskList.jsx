import { useRef, useState } from 'react';
import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { filterAndSortTasks } from '../lib/taskList';

export function TaskList({
  tasks,
  loading,
  error,
  onRetry,
  selectedTaskId,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  mutationBusy = false,
  disabled = false,
}) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const heading = useRef(null);
  const visibleTasks = filterAndSortTasks(tasks, search, sortOrder);
  const taskSelected = tasks.find((task) => task.id === selectedTaskId);

  async function confirmDelete(task) {
    if (!window.confirm(`Excluir a Task “${task.title}”? Esta ação não pode ser desfeita.`)) {
      return;
    }
    if (await onDeleteTask(task)) {
      requestAnimationFrame(() => heading.current?.focus());
    }
  }

  return (
    <section className="card mt-5 max-w-3xl" aria-labelledby="tasks-list-title">
      <h2 ref={heading} id="tasks-list-title" className="text-lg font-bold" tabIndex={-1}>
        Tasks cadastradas
      </h2>
      {error && (
        <ErrorNotice className="mt-3" onRetry={onRetry}>
          {error}
        </ErrorNotice>
      )}
      {loading ? (
        <LoadingSkeleton label="Carregando Tasks…" />
      ) : error && tasks.length === 0 ? null : tasks.length === 0 ? (
        <EmptyState>Nenhuma Task cadastrada.</EmptyState>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label htmlFor="task-search" className="text-xs font-semibold muted">
              Pesquisar por título ou descrição
              <input
                id="task-search"
                className="form-field mt-1"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={disabled}
              />
            </label>
            <label htmlFor="task-sort" className="text-xs font-semibold muted">
              Ordenar Tasks
              <select
                id="task-sort"
                className="form-field mt-1"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                disabled={disabled}
              >
                <option value="recent">Mais recentes primeiro</option>
                <option value="title-asc">Título (A–Z)</option>
                <option value="title-desc">Título (Z–A)</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs font-semibold muted" role="status" aria-live="polite">
            {search.trim()
              ? `Pesquisa ativa: ${search.trim()} — ${visibleTasks.length} ${visibleTasks.length === 1 ? 'resultado' : 'resultados'}`
              : `${visibleTasks.length} ${visibleTasks.length === 1 ? 'resultado' : 'resultados'}`}
          </p>
          {search.trim() && (
            <button
              type="button"
              className="secondary-button mt-2"
              onClick={() => setSearch('')}
              disabled={disabled}
            >
              Limpar pesquisa
            </button>
          )}
          {taskSelected && (
            <section
              className="mt-4 rounded-lg border border-brand/30 bg-indigo-50/60 p-4 dark:bg-indigo-950/30"
              aria-labelledby="selected-task-title"
            >
              <h3 id="selected-task-title" className="font-bold">
                Task selecionada para consulta
              </h3>
              <p className="mt-2 font-semibold">{taskSelected.title}</p>
              <p className="mt-1 break-words text-sm">{taskSelected.description}</p>
              <p className="mt-2 text-xs muted">
                Colaboradores:{' '}
                {taskSelected.collaborators
                  .map((person) => person.full_name || person.username)
                  .join(', ')}
              </p>
              <p className="mt-1 break-all text-xs muted">ID: {taskSelected.id}</p>
              <p className="mt-1 text-xs muted">
                Criada em {new Date(taskSelected.created_at).toLocaleString('pt-BR')}
              </p>
              <p className="mt-2 text-xs muted">
                Esta seleção local serve apenas para consultar detalhes. Não inicia nem associa
                monitoramento.
              </p>
              <button
                type="button"
                className="secondary-button mt-3"
                onClick={() => onSelectTask('')}
                disabled={disabled}
              >
                Limpar seleção
              </button>
            </section>
          )}
          {visibleTasks.length === 0 ? (
            <EmptyState className="mt-3">Nenhuma Task corresponde à pesquisa.</EmptyState>
          ) : (
            <ul
              className="mt-3 divide-y divide-line dark:divide-slate-700"
              aria-label="Tasks da equipe"
            >
              {visibleTasks.map((task) => {
                const selected = taskSelected?.id === task.id;
                return (
                  <li key={task.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''}`}
                        aria-label={
                          selected
                            ? `Task selecionada: ${task.title}`
                            : `Ver detalhes da Task: ${task.title}`
                        }
                        aria-pressed={selected}
                        onClick={() => onSelectTask(selected ? '' : task.id)}
                        disabled={disabled}
                      >
                        <span className="block break-words font-semibold">{task.title}</span>
                        <span className="mt-1 block line-clamp-2 text-sm muted">
                          {task.description}
                        </span>
                      </button>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={(event) => onEditTask(task, event)}
                          disabled={disabled || mutationBusy}
                          aria-label={`Editar Task: ${task.title}`}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void confirmDelete(task)}
                          disabled={disabled || mutationBusy}
                          aria-label={`Excluir Task: ${task.title}`}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 px-2 text-xs muted">
                      Criada em {new Date(task.created_at).toLocaleString('pt-BR')} ·{' '}
                      {task.collaborators.length}{' '}
                      {task.collaborators.length === 1 ? 'colaborador' : 'colaboradores'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
