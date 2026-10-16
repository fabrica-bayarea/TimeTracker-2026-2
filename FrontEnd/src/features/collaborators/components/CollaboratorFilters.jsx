import { formatProcessName, formatProcessOption } from '../../../shared/lib/processFilter';
import { getCollaboratorStatusLabel } from '../lib/agentFilters';

const statuses = ['online', 'ausente', 'offline', 'no-data', 'unavailable'];

export function CollaboratorFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  process,
  onProcessChange,
  sort,
  onSortChange,
  processOptions,
  processAvailable,
  resultCount,
  totalCount,
  hasFilters,
  canClearFilters = hasFilters,
  onClear,
}) {
  const selectedProcessAvailable = processOptions.includes(process);

  return (
    <section className="card mb-5" aria-label="Filtros de colaboradores">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold muted">
          Pesquisar colaborador
          <input
            className="form-field mt-1"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nome ou usuário"
          />
        </label>
        <label className="text-xs font-semibold muted">
          Estado informado pela API
          <select
            className="form-field mt-1"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">Todos os estados</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {getCollaboratorStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold muted">
          Aplicativo na última leitura
          <select
            className="form-field mt-1"
            value={process}
            onChange={(event) => onProcessChange(event.target.value)}
            disabled={!processAvailable || (!processOptions.length && !process)}
          >
            <option value="">Todos os aplicativos</option>
            {process && !selectedProcessAvailable && (
              <option value={process}>
                {formatProcessName(process) || 'Aplicativo desconhecido'} (indisponível)
              </option>
            )}
            {processOptions.map((value) => (
              <option key={value} value={value}>
                {formatProcessOption(value, processOptions)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold muted">
          Ordenar por
          <select
            className="form-field mt-1"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="name">Nome</option>
            <option value="recent">Leitura mais recente</option>
            <option value="oldest">Leitura mais antiga</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold muted" role="status" aria-live="polite">
          {resultCount} de {totalCount} colaboradores
          {hasFilters ? ' com os filtros atuais' : ''}
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={onClear}
          disabled={!canClearFilters}
        >
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
