import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { fmtDuration } from '../../../shared/lib/duration';
import { validTaskProductivity } from '../../../shared/api/validators';

export function TaskProductivityCard({
  metrics = null,
  available = false,
  loading = false,
  error = null,
  selectedTaskId = '',
  selectedTaskTitle = '',
  onRetry,
}) {
  const validMetrics =
    validTaskProductivity(metrics) && (!selectedTaskId || metrics.task_id === selectedTaskId);

  return (
    <section className="card" aria-labelledby="task-productivity-title" aria-busy={loading}>
      <h2 id="task-productivity-title" className="text-lg font-bold">
        Tempo registrado e produtivo
      </h2>
      {selectedTaskTitle && <p className="mt-1 text-xs muted">Task: {selectedTaskTitle}</p>}
      {error && (
        <ErrorNotice className="mt-3" onRetry={onRetry}>
          Não foi possível carregar as métricas de produtividade. {error}
        </ErrorNotice>
      )}
      {loading && <LoadingSkeleton label="Carregando métricas de produtividade…" />}
      {!loading && !error && !available && (
        <div className="mt-3">
          <IntegrationNotice>
            A API não fornece classificação de tempo produtivo por Task. O campo `is_idle` não
            define produtividade; essa regra depende do escopo aprovado para cada Task.
          </IntegrationNotice>
        </div>
      )}
      {!loading && !error && available && metrics == null && (
        <EmptyState className="mt-3">
          Não há métricas para a Task e os filtros selecionados.
        </EmptyState>
      )}
      {!loading && !error && available && metrics != null && !validMetrics && (
        <ErrorNotice className="mt-3">
          A resposta de produtividade é inválida ou não corresponde à Task selecionada.
        </ErrorNotice>
      )}
      {!loading && !error && available && validMetrics && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="text-sm muted">Tempo registrado</dt>
            <dd className="mt-2 font-mono text-xl font-semibold">
              {fmtDuration(metrics.registered_seconds)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="text-sm muted">Tempo produtivo</dt>
            <dd className="mt-2 font-mono text-xl font-semibold">
              {fmtDuration(metrics.productive_seconds)}
            </dd>
          </div>
        </dl>
      )}
      <p className="mt-3 text-xs muted">
        Os valores são apresentados lado a lado, sem percentual ou comparação entre colaboradores.
      </p>
    </section>
  );
}
