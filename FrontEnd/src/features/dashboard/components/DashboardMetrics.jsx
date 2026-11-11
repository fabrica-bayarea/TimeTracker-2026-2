import { MetricCard } from '../../../shared/components/MetricCard';
import { countPeopleByStatus } from '../../../shared/lib/team';
import { fmtDuration } from '../../../shared/lib/duration';
import { totalSeconds } from '../lib/summary';

export function DashboardMetrics({ loading, available, filtered, summary, users, username }) {
  const status = (name) =>
    available.users && available.realtime ? countPeopleByStatus(filtered, name) : '—';
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
      aria-label="Indicadores disponíveis"
      aria-busy={loading}
    >
      <MetricCard
        loading={loading}
        label="Online"
        value={status('online')}
        detail="atividade recente recebida pela API"
      />
      <MetricCard
        loading={loading}
        label="Ausentes"
        value={status('ausente')}
        detail="estado ausente informado pela API"
      />
      <MetricCard
        loading={loading}
        label="Offline (API)"
        value={status('offline')}
        detail="estado offline informado pela API; não confirma desconexão"
      />
      <MetricCard
        loading={loading}
        label="Sem dados"
        value={
          available.users && available.realtime ? countPeopleByStatus(filtered, 'no-data') : '—'
        }
        detail="usuários sem entrada na resposta realtime de até 24 h"
      />
      <MetricCard
        loading={loading}
        label="Tempo registrado"
        value={available.summary ? fmtDuration(totalSeconds(summary)) : '—'}
        detail="resumo da data selecionada"
      />
      <MetricCard
        loading={loading}
        label="Usuários cadastrados"
        value={
          available.users
            ? username
              ? users.filter((user) => user.username === username).length
              : users.length
            : '—'
        }
        detail="equipe do gestor autenticado"
      />
    </section>
  );
}
