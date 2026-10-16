import { PageHeader } from '../../../shared/components/PageHeader';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { useState } from 'react';
import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { useTasks } from '../hooks/useTasks';
import { validTaskDescription } from '../../../shared/api/validators';
import { filterAndSortTasks } from '../lib/taskList';

function UnavailableTasks() {
  return (
    <>
      <PageHeader title="Tasks" description="Criação e edição de tasks do gestor." />
      <IntegrationNotice>
        O backend ainda não oferece consulta ou persistência de tasks, associação de colaboradores
        nem aplicações do escopo. Esta página será habilitada quando esses contratos existirem. A
        criação persistida pelo Dashboard, quando disponível, não inicia nem controla o
        monitoramento pelo Agent.
      </IntegrationNotice>
      <section className="card mt-5 max-w-3xl text-center" aria-labelledby="tasks-empty-title">
        <div
          aria-hidden="true"
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-3xl text-brand dark:bg-indigo-950"
        >
          ☷
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-brand">
          Aguardando integração
        </p>
        <h2 id="tasks-empty-title" className="mt-2 text-xl font-bold">
          Organização de tasks da equipe
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 muted">
          Quando a API oferecer suporte, esta área reunirá as tasks definidas pelo gestor e a
          associação de colaboradores e aplicações ao escopo de cada uma.
        </p>
      </section>
    </>
  );
}

function MockTasks({ devApi }) {
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const { tasks, loading, error, saving, saveError, created, load, createTask } = useTasks(devApi);
  const visibleTasks = filterAndSortTasks(tasks, search, sortOrder);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  async function submit(event) {
    event.preventDefault();
    setValidationError(null);
    if (!validTaskDescription(description)) {
      setValidationError('Informe uma descrição de até 200 caracteres.');
      return;
    }
    const saved = await createTask(description);
    if (saved) {
      setDescription('');
      setSearch('');
      setSortOrder('recent');
    }
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Lista e criação de Tasks em ambiente de demonstração."
      />
      <IntegrationNotice>
        Esta tela usa os contratos propostos apenas quando os mocks de desenvolvimento estão ativos.
        Criar uma Task não inicia monitoramento nem a atribui a um colaborador.
      </IntegrationNotice>
      <section
        className="card mt-5 max-w-3xl"
        aria-labelledby="create-task-title"
        data-mock-only="true"
      >
        <h2 id="create-task-title" className="text-lg font-bold">
          Criar Task
        </h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <label htmlFor="task-description" className="block text-sm font-semibold">
            Descrição
          </label>
          <input
            id="task-description"
            className="form-field"
            value={description}
            required
            maxLength={200}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={validationError ? 'true' : undefined}
            aria-describedby={
              validationError
                ? 'task-description-help task-description-error'
                : 'task-description-help'
            }
          />
          <p id="task-description-help" className="text-xs muted">
            Até 200 caracteres.
          </p>
          {validationError && (
            <p
              id="task-description-error"
              role="alert"
              className="text-sm text-red-700 dark:text-red-300"
            >
              {validationError}
            </p>
          )}
          {saveError && <ErrorNotice>{saveError}</ErrorNotice>}
          {created && (
            <p
              role="status"
              className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Task criada em dados simulados.
            </p>
          )}
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Criando…' : 'Criar Task'}
          </button>
        </form>
      </section>
      <section className="card mt-5 max-w-3xl" aria-labelledby="tasks-list-title">
        <h2 id="tasks-list-title" className="text-lg font-bold">
          Tasks cadastradas
        </h2>
        {error && (
          <ErrorNotice className="mt-3" onRetry={load}>
            {error}
          </ErrorNotice>
        )}
        {loading ? (
          <LoadingSkeleton label="Carregando Tasks…" />
        ) : error && tasks.length === 0 ? null : tasks.length === 0 ? (
          <EmptyState>Nenhuma Task foi criada neste modo de demonstração.</EmptyState>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label htmlFor="task-search" className="text-xs font-semibold muted">
                Pesquisar Tasks por descrição
                <input
                  id="task-search"
                  className="form-field mt-1"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="task-sort" className="text-xs font-semibold muted">
                Ordenar Tasks
                <select
                  id="task-sort"
                  className="form-field mt-1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="recent">Mais recentes primeiro</option>
                  <option value="description-asc">Descrição (A–Z)</option>
                  <option value="description-desc">Descrição (Z–A)</option>
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs font-semibold muted" role="status" aria-live="polite">
              {search.trim()
                ? `Pesquisa ativa: ${search.trim()} — ${visibleTasks.length} ${visibleTasks.length === 1 ? 'resultado' : 'resultados'}`
                : `${visibleTasks.length} ${visibleTasks.length === 1 ? 'resultado' : 'resultados'}`}
            </p>
            {search.trim() && (
              <button type="button" className="secondary-button mt-2" onClick={() => setSearch('')}>
                Limpar pesquisa
              </button>
            )}
            {selectedTask && (
              <section
                className="mt-4 rounded-lg border border-brand/30 bg-indigo-50/60 p-4 dark:bg-indigo-950/30"
                aria-labelledby="selected-task-title"
              >
                <h3 id="selected-task-title" className="font-bold">
                  Task selecionada para consulta
                </h3>
                <p className="mt-2 font-semibold">{selectedTask.description}</p>
                <p className="mt-1 break-all text-xs muted">ID: {selectedTask.id}</p>
                <p className="mt-1 text-xs muted">
                  Criada em {new Date(selectedTask.created_at).toLocaleString('pt-BR')}
                </p>
                <p className="mt-2 text-xs muted">
                  Esta seleção local serve apenas para consultar detalhes. Não inicia nem associa
                  monitoramento.
                </p>
                <button
                  type="button"
                  className="secondary-button mt-3"
                  onClick={() => setSelectedTaskId('')}
                >
                  Limpar seleção
                </button>
              </section>
            )}
            {visibleTasks.length === 0 ? (
              <EmptyState className="mt-3">Nenhuma Task corresponde à pesquisa.</EmptyState>
            ) : (
              <ul className="mt-3 divide-y divide-line dark:divide-slate-700">
                {visibleTasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  return (
                    <li key={task.id} className="py-3">
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''}`}
                        aria-label={
                          isSelected
                            ? `Task selecionada: ${task.description}`
                            : `Ver detalhes da Task: ${task.description}`
                        }
                        aria-pressed={isSelected}
                        onClick={() =>
                          setSelectedTaskId((current) => (current === task.id ? '' : task.id))
                        }
                      >
                        <span className="min-w-0 break-words font-semibold">
                          {task.description}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-brand">
                          {isSelected ? 'Selecionada' : 'Ver detalhes'}
                        </span>
                      </button>
                      <p className="mt-1 px-2 text-xs muted">
                        Criada em {new Date(task.created_at).toLocaleString('pt-BR')}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}

export function TasksPage({ devApi = null }) {
  return import.meta.env.DEV && devApi ? <MockTasks devApi={devApi} /> : <UnavailableTasks />;
}
