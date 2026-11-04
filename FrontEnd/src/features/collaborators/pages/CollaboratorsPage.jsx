import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { EmptyState, ErrorNotice, LoadingSkeleton } from '../../../shared/components/AsyncFeedback';
import { useCollaboratorsData } from '../hooks/useCollaboratorsData';
import { CollaboratorsTable } from '../components/CollaboratorsTable';
import { CollaboratorFilters } from '../components/CollaboratorFilters';
import { getRealtimeProcessOptions } from '../../../shared/lib/processFilter';
import { formatQueryUpdatedAt } from '../../../shared/lib/relativeTime';
import { filterCollaborators } from '../lib/agentFilters';

export function CollaboratorsPage() {
  const {
    loading,
    users,
    realtime,
    error,
    people,
    refresh,
    refreshState,
    lastUpdatedAt,
    realtimeObservedAt,
  } = useCollaboratorsData();
  const [filters, setFilters] = useState({ query: '', status: '', process: '', sort: 'name' });
  const [now, setNow] = useState(() => performance.now());
  const realtimeAvailable = Boolean(realtime);
  const processOptions = useMemo(() => getRealtimeProcessOptions(people), [people]);
  const visiblePeople = useMemo(
    () => filterCollaborators(people, { ...filters, realtimeAvailable }),
    [people, filters, realtimeAvailable],
  );
  const hasFilters = Boolean(filters.query || filters.status || filters.process);
  const hasLastRead = people.some((person) =>
    Number.isFinite(person?.realtime?.seconds_since_last_activity),
  );
  const canClearFilters = hasFilters || filters.sort !== 'name';
  const updatedAtLabel = formatQueryUpdatedAt(lastUpdatedAt);
  const queryStatus =
    refreshState === 'loading'
      ? lastUpdatedAt
        ? `Atualizando a consulta. Última resposta válida recebida em ${updatedAtLabel} (horário de Brasília).`
        : 'Consultando a API…'
      : refreshState === 'complete'
        ? `Última atualização da consulta: ${updatedAtLabel} (horário de Brasília).`
        : refreshState === 'partial'
          ? `Resposta parcial da consulta recebida em ${updatedAtLabel} (horário de Brasília); consulte o aviso de erro.`
          : lastUpdatedAt
            ? `Falha na atualização atual. Última resposta válida recebida em ${updatedAtLabel} (horário de Brasília).`
            : 'Falha na consulta; nenhuma resposta válida foi recebida.';

  useEffect(() => {
    if (!realtimeAvailable || !hasLastRead) return undefined;

    const interval = setInterval(() => setNow(performance.now()), 60_000);
    return () => clearInterval(interval);
  }, [hasLastRead, realtimeAvailable]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters({ query: '', status: '', process: '', sort: 'name' });
  }

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Estado e última leitura informados pela atividade mais recente da API."
        actions={
          <button type="button" className="secondary-button" onClick={refresh} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        }
      />
      <p
        className="mt-2 text-xs muted"
        role="status"
        aria-label="Atualização da consulta"
        aria-live="polite"
      >
        {queryStatus}
      </p>
      <IntegrationNotice>
        RF-03/RF-05 exigem código de associação e lista restrita ao gestor autenticado. A API atual
        retorna todos os usuários e não aplica autorização por gestor. Online, Ausente e Offline são
        estados calculados pela API a partir da captura e de sua inatividade; eles não confirmam a
        conexão do Agent. “Sem dados” indica que o usuário não consta na janela realtime de até 24
        horas. “Última leitura” é o tempo desde a captura informada, não uma confirmação de
        sincronização ou contato atual.
      </IntegrationNotice>
      {error && (
        <ErrorNotice className="mt-5" onRetry={refresh}>
          {error}
        </ErrorNotice>
      )}
      {users?.length > 0 && (
        <CollaboratorFilters
          query={filters.query}
          onQueryChange={(value) => updateFilter('query', value)}
          status={filters.status}
          onStatusChange={(value) => updateFilter('status', value)}
          process={filters.process}
          onProcessChange={(value) => updateFilter('process', value)}
          sort={filters.sort}
          onSortChange={(value) => updateFilter('sort', value)}
          processOptions={processOptions}
          processAvailable={realtimeAvailable}
          resultCount={visiblePeople.length}
          totalCount={people.length}
          hasFilters={hasFilters}
          canClearFilters={canClearFilters}
          onClear={clearFilters}
        />
      )}
      <section className="card mt-5" aria-busy={loading}>
        {loading ? (
          <LoadingSkeleton label="Carregando colaboradores…" lines={5} />
        ) : users && !users.length ? (
          <EmptyState>Nenhum usuário cadastrado.</EmptyState>
        ) : !users ? (
          <EmptyState>Lista indisponível.</EmptyState>
        ) : !visiblePeople.length ? (
          <EmptyState>Nenhum colaborador corresponde aos filtros aplicados.</EmptyState>
        ) : (
          <CollaboratorsTable
            people={visiblePeople}
            realtimeAvailable={realtimeAvailable}
            processOptions={processOptions}
            lastReadObservedAt={realtimeObservedAt}
            now={now}
          />
        )}
      </section>
    </>
  );
}
