import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { fmtDuration } from '../../../shared/lib/duration';

export function TaskSummaryCard({
  demo = false,
  date,
  selectedTaskId = '',
  summary,
  loading = false,
  error = null,
  onRetry,
}) {
  const entries = Array.isArray(summary?.tasks) ? summary.tasks : [];
  const integrationPending = !demo && !summary && !loading && !error;

  if (integrationPending) {
    return (
      <section className="card" aria-labelledby="task-summary-title">
        <h2 id="task-summary-title" className="text-lg font-bold">
          Tempo por Task
        </h2>
        <div className="mt-3">
          <IntegrationNotice>
            A API ainda não fornece agregações reais com `task_id`. Horas por Task e filtro de Tasks
            ficam indisponíveis até a entrega dos contratos #133, #137 e #140.
          </IntegrationNotice>
        </div>
      </section>
    );
  }

  const validDurations = entries
    .map((entry) => entry.total_seconds)
    .filter((value) => Number.isSafeInteger(value) && value >= 0);
  const longest = Math.max(0, ...validDurations);

  return (
    <section className="card" aria-labelledby="task-summary-title" aria-busy={loading}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="task-summary-title" className="text-lg font-bold">
            Tempo por Task
          </h2>
          <p className="mt-1 text-xs muted">
            {demo ? 'Resumo simulado' : 'Resumo da API'}
            {date ? ` · ${date}` : ''}
            {demo ? ' · não representa atividade real' : ''}
          </p>
        </div>
        {summary && <p className="text-xs muted">Fuso: {summary.timezone}</p>}
      </div>
      {error && (
        <ErrorNotice className="mt-3" onRetry={onRetry}>
          {demo
            ? `Fonte demonstrativa de horas por Task indisponível. ${error}`
            : `Não foi possível carregar o resumo por Task. ${error}`}
        </ErrorNotice>
      )}
      {loading && summary && (
        <p role="status" className="mt-3 text-xs muted">
          Atualizando resumo por Task…
        </p>
      )}
      {loading && !summary ? (
        <LoadingSkeleton label="Carregando resumo por Task…" />
      ) : !loading && !error && entries.length === 0 ? (
        <EmptyState className="mt-3">
          {demo
            ? selectedTaskId
              ? 'Não há dados simulados para a Task selecionada.'
              : 'Não há dados simulados de atividade por Task para esta data.'
            : selectedTaskId
              ? 'A API não retornou dados para a Task selecionada.'
              : 'A API não retornou atividades por Task para esta data.'}
        </EmptyState>
      ) : entries.length > 0 ? (
        <ul
          className="mt-4 space-y-4"
          aria-label={demo ? 'Horas simuladas por Task' : 'Horas por Task'}
        >
          {entries.map((entry) => {
            const validDuration =
              Number.isSafeInteger(entry.total_seconds) && entry.total_seconds >= 0;
            const width = longest && validDuration ? (entry.total_seconds / longest) * 100 : 0;
            const collaborators = entry.collaborators
              .map((person) => person.full_name || person.username)
              .join(', ');
            return (
              <li key={entry.task_id || 'unassigned'}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">
                    {entry.task_id ? entry.title : 'Sem Task / Atividades Gerais'}
                  </h3>
                  <span className="font-mono text-sm font-semibold">
                    {validDuration ? fmtDuration(entry.total_seconds) : '—'}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Proporção de ${entry.task_id ? entry.title : 'Sem Task / Atividades Gerais'} em relação à maior duração`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(width)}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
                </div>
                <p className="mt-1 text-xs muted">
                  {entry.task_id ? 'Task vinculada' : 'Atividade geral sem Task'}
                  {collaborators
                    ? ` · Colaboradores: ${collaborators}`
                    : ' · Sem colaboradores associados'}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="mt-4 text-xs muted">
        A ordenação e o total consolidado permanecem sob definição. Nenhum ranking é calculado.
      </p>
    </section>
  );
}
