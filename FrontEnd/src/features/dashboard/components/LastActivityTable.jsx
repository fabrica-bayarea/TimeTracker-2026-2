import { EmptyState, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { ActivityStatusBadge } from '../../../shared/components/ActivityStatusBadge';
import { formatLastRead } from '../../../shared/lib/relativeTime';
import { formatProcessName, formatProcessOption } from '../../../shared/lib/processFilter';

export { formatLastRead };

function lastRead(person) {
  return person.realtime ? formatLastRead(person.realtime.seconds_since_last_activity) : '—';
}

export function LastActivityTable({
  people,
  totalPeople = people.length,
  loading,
  available,
  processOptions = [],
  selectedProcess = '',
  onProcessChange = () => {},
}) {
  const selectedProcessAvailable = processOptions.includes(selectedProcess);

  return (
    <article className="card min-w-0" aria-busy={loading}>
      <h2 className="font-bold">Última atividade</h2>
      <p className="mt-1 text-xs muted">
        Esta tabela é atual e não segue o filtro de data do resumo.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label htmlFor="last-activity-process" className="block w-full text-xs font-semibold muted">
          Aplicativo na última atividade
          <select
            id="last-activity-process"
            className="form-field mt-1"
            value={selectedProcess}
            onChange={(event) => onProcessChange(event.target.value)}
            disabled={!available || (!processOptions.length && !selectedProcess)}
            aria-describedby="last-activity-process-help"
          >
            <option value="">Todos os aplicativos</option>
            {selectedProcess && !selectedProcessAvailable && (
              <option value={selectedProcess}>
                {formatProcessName(selectedProcess) || 'Aplicativo desconhecido'} (indisponível)
              </option>
            )}
            {processOptions.map((processName) => (
              <option key={processName} value={processName}>
                {formatProcessOption(processName, processOptions)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button shrink-0"
          onClick={() => onProcessChange('')}
          disabled={!selectedProcess}
        >
          Limpar aplicativo
        </button>
      </div>
      <p id="last-activity-process-help" className="mt-2 text-xs muted">
        O filtro afeta somente esta lista; não altera os indicadores nem o resumo diário.
      </p>
      {!loading && available && (
        <p className="mt-2 text-xs font-semibold muted" role="status" aria-live="polite">
          {selectedProcess
            ? `Filtro ativo: ${formatProcessOption(selectedProcess, processOptions)}; ${people.length} de ${totalPeople} usuários nesta lista`
            : `${people.length} usuários nesta lista`}
        </p>
      )}
      {loading ? (
        <LoadingSkeleton label="Carregando atividade…" lines={4} />
      ) : !available ? (
        <EmptyState>Dados de atividade indisponíveis.</EmptyState>
      ) : !people.length ? (
        <EmptyState>
          {selectedProcess
            ? 'Nenhum usuário corresponde aos filtros aplicados.'
            : 'Nenhum usuário encontrado.'}
        </EmptyState>
      ) : (
        <>
          <div
            className="mt-4 grid gap-3 sm:hidden"
            aria-label="Última atividade dos usuários cadastrados"
          >
            {people.map((person) => (
              <div
                key={person.username}
                className="rounded-lg border border-line p-3 text-sm dark:border-slate-700"
              >
                <h3 className="font-semibold">{person.full_name || person.username}</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="muted">Estado</dt>
                  <dd>
                    <ActivityStatusBadge person={person} />
                  </dd>
                  <dt className="muted">Aplicação</dt>
                  <dd>
                    {formatProcessOption(person.realtime?.process_name, processOptions) || '—'}
                  </dd>
                  <dt className="muted">Última leitura</dt>
                  <dd>{lastRead(person)}</dd>
                </dl>
              </div>
            ))}
          </div>
          <div
            className="mt-4 hidden overflow-x-auto sm:block"
            tabIndex="0"
            aria-label="Tabela de última atividade com rolagem horizontal"
          >
            <table className="w-full min-w-[580px] text-left text-sm">
              <caption className="sr-only">Última atividade dos usuários cadastrados</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="py-2">
                    Usuário
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Aplicação</th>
                  <th scope="col">Última leitura</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr
                    key={person.username}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <th scope="row" className="py-3 font-semibold">
                      {person.full_name || person.username}
                    </th>
                    <td>
                      <ActivityStatusBadge person={person} />
                    </td>
                    <td>
                      {formatProcessOption(person.realtime?.process_name, processOptions) || '—'}
                    </td>
                    <td>{lastRead(person)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}
