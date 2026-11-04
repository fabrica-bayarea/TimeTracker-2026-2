import { useState } from 'react';
import { todayIso } from '../../../shared/lib/date';
import { PageHeader } from '../../../shared/components/PageHeader';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { ReportFilters } from '../components/ReportFilters';
import { ReportUsersState } from '../components/ReportUsersState';
import { ExportActions } from '../components/ExportActions';
import { useReportExport } from '../hooks/useReportExport';
import { useReportUsers } from '../hooks/useReportUsers';

export function ReportsPage() {
  const [date, setDate] = useState(todayIso());
  const [username, setUsername] = useState('');
  const { users, loadingUsers, usersError, loadUsers } = useReportUsers();
  const { exporting, error, success, download, clearFeedback, dismissSuccess } = useReportExport(
    date,
    username,
  );

  const changeDate = (value) => {
    setDate(value);
    clearFeedback();
  };
  const changeUsername = (value) => {
    setUsername(value);
    clearFeedback();
  };

  return (
    <>
      <PageHeader title="Relatórios" description="Exportação do resumo diário disponível na API." />
      <IntegrationNotice title="Escopo parcial do RF-24/RF-25">
        O arquivo contém usuário, categoria e tempo registrado de um dia. Período, task, jornada,
        horas extras e classificação por escopo precisam de novos contratos no backend. A lista de
        usuários, resumo e exportação são globais; esses endpoints não exigem nem aplicam
        autorização por gestor.
      </IntegrationNotice>
      <section className="card mt-5" aria-busy={!!exporting}>
        <h2 className="font-bold">Filtros disponíveis</h2>
        <ReportFilters
          date={date}
          onDateChange={changeDate}
          username={username}
          onUsernameChange={changeUsername}
          users={users}
          loadingUsers={loadingUsers}
          exporting={exporting}
        />
        <ReportUsersState
          loading={loadingUsers}
          users={users}
          error={usersError}
          onRetry={loadUsers}
        />
        <ExportActions
          date={date}
          exporting={exporting}
          error={error}
          success={success}
          onDownload={download}
          onDismiss={dismissSuccess}
        />
      </section>
    </>
  );
}
