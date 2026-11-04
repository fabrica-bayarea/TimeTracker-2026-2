import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { fmtDuration } from '../../../shared/lib/duration';
import { validTaskTimeline } from '../../../shared/api/validators';

const eventTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'America/Sao_Paulo',
});

export function TaskActivityTimeline({
  data = null,
  available = false,
  loading = false,
  error = null,
  selectedTaskId = '',
  selectedTaskTitle = '',
  date,
  username = '',
  onRetry,
}) {
  const validData = validTaskTimeline(data) && (!selectedTaskId || data.task_id === selectedTaskId);
  const events = validData
    ? [...data.events].sort(
        (first, second) => Date.parse(first.captured_at) - Date.parse(second.captured_at),
      )
    : [];

  return (
    <section className="card" aria-labelledby="task-timeline-title" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="task-timeline-title" className="text-lg font-bold">
            Linha do tempo da Task
          </h2>
          <p className="mt-1 text-xs muted">
            {selectedTaskTitle || (selectedTaskId ? 'Task selecionada' : 'Selecione uma Task')}
            {date ? ` · ${date}` : ''}
            {username ? ` · ${username}` : ''}
          </p>
        </div>
        {available && onRetry && (
          <button className="secondary-button" type="button" onClick={onRetry} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar linha do tempo'}
          </button>
        )}
      </div>
      {error && (
        <ErrorNotice className="mt-3" onRetry={onRetry}>
          Não foi possível carregar os eventos da Task. {error}
        </ErrorNotice>
      )}
      {loading && <LoadingSkeleton label="Carregando linha do tempo…" />}
      {!loading && !error && !available && (
        <div className="mt-3">
          <IntegrationNotice>
            A API não fornece consulta cronológica de atividades vinculadas à Task. A data, o
            colaborador e a Task selecionados serão aplicados quando houver um endpoint autorizado.
          </IntegrationNotice>
        </div>
      )}
      {!loading && !error && available && data != null && !validData && (
        <ErrorNotice className="mt-3">
          A resposta da linha do tempo é inválida ou não corresponde à Task selecionada.
        </ErrorNotice>
      )}
      {!loading && !error && available && data == null && (
        <EmptyState className="mt-3">
          Não há resposta de atividades para os filtros selecionados.
        </EmptyState>
      )}
      {!loading && !error && available && validData && events.length === 0 && (
        <EmptyState className="mt-3">
          Não há atividades vinculadas a esta Task no período.
        </EmptyState>
      )}
      {!loading && !error && available && validData && events.length > 0 && (
        <ol className="mt-4 space-y-4" aria-label="Eventos em ordem cronológica">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-brand pl-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <time className="text-sm font-semibold" dateTime={event.captured_at}>
                  {eventTime.format(new Date(event.captured_at))}
                </time>
                <span className="font-mono text-sm">{fmtDuration(event.duration_seconds)}</span>
              </div>
              <p className="mt-1 text-sm">
                {event.process_name} <span className="muted">· {event.username}</span>
              </p>
              {typeof event.is_idle === 'boolean' && (
                <p className="mt-1 text-xs muted">
                  {event.is_idle
                    ? 'Inatividade registrada'
                    : 'Atividade sem marcação de inatividade'}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs muted">
        A lista mostra o instante recebido; não infere intervalos nem classifica produtividade.
      </p>
    </section>
  );
}
