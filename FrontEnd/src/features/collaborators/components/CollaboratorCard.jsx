import { ActivityStatusBadge } from '../../../shared/components/ActivityStatusBadge';
import { formatLastReadAt } from '../../../shared/lib/relativeTime';
import { formatProcessOption } from '../../../shared/lib/processFilter';

export function CollaboratorCard({
  person,
  realtimeAvailable,
  processOptions = [],
  lastReadObservedAt = null,
  now,
}) {
  return (
    <article className="rounded-lg border border-line p-3 text-sm dark:border-slate-700">
      <h2 className="font-semibold">{person.full_name || person.username}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="muted">Usuário</dt>
        <dd>{person.username}</dd>
        <dt className="muted">Departamento</dt>
        <dd>{person.department || '—'}</dd>
        <dt className="muted">Estado da atividade</dt>
        <dd>
          <ActivityStatusBadge person={person} available={realtimeAvailable} />
        </dd>
        <dt className="muted">Aplicação</dt>
        <dd>{formatProcessOption(person.realtime?.process_name, processOptions) || '—'}</dd>
        <dt className="muted">Última leitura</dt>
        <dd>
          {realtimeAvailable
            ? formatLastReadAt(
                person.realtime?.seconds_since_last_activity,
                lastReadObservedAt,
                now,
              )
            : '—'}
        </dd>
      </dl>
    </article>
  );
}
