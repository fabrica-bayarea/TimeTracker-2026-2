import { useEffect, useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardFilters } from '../components/DashboardFilters';
import { DashboardMetrics } from '../components/DashboardMetrics';
import { LastActivityTable } from '../components/LastActivityTable';
import { CategorySummary } from '../components/CategorySummary';
import { DashboardStatusNotice } from '../components/DashboardStatusNotice';
import { ErrorNotice } from '../../../shared/components/AsyncFeedback';
import { PageHeader } from '../../../shared/components/PageHeader';
import { todayIso } from '../../../shared/lib/date';
import { deriveTeam, filterRealtimePeople } from '../../../shared/lib/team';
import { categoryTotals, totalSeconds } from '../lib/summary';
import { AttendanceSummary } from '../components/AttendanceSummary';
import {
  filterPeopleByProcess,
  getRealtimeProcessOptions,
} from '../../../shared/lib/processFilter';
import { useTaskAnalytics } from '../hooks/useTaskAnalytics';
import { TaskSummaryCard } from '../components/TaskSummaryCard';
import { AssociationCodeCard } from '../components/AssociationCodeCard';
import { useAssociationCode } from '../hooks/useAssociationCode';

export function DashboardPage({
  dark,
  toggleTheme,
  devApi = null,
  manager = null,
  associationClient,
}) {
  const [date, setDate] = useState(todayIso());
  const [username, setUsername] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [taskId, setTaskId] = useState('');
  const { data, loading, refreshing, error, updatedAt, refresh } = useDashboardData(date, username);
  const taskAnalytics = useTaskAnalytics(devApi, date, username, taskId);
  const associationCode = useAssociationCode(manager, associationClient);
  useEffect(() => {
    if (
      taskAnalytics.tasksAvailable &&
      taskId &&
      !taskAnalytics.tasks.some((task) => task.id === taskId)
    ) {
      setTaskId('');
    }
  }, [taskAnalytics.tasks, taskAnalytics.tasksAvailable, taskId]);
  const availability = data?.availability || {};
  const users = data?.users || [];
  const teamMembers =
    availability.users && availability.realtime ? deriveTeam(users, data.realtime) : [];
  const filteredTeam = filterRealtimePeople(teamMembers, username);
  const processOptions = getRealtimeProcessOptions(teamMembers);
  const filteredActivity = filterPeopleByProcess(filteredTeam, selectedProcess);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Resumo diário e última atividade dos usuários cadastrados na API."
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={toggleTheme}>
              {dark ? 'Tema claro' : 'Tema escuro'}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                refresh();
                taskAnalytics.retry();
              }}
              disabled={loading || refreshing}
            >
              {refreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        }
      />
      <DashboardStatusNotice />
      {manager?.id && (
        <AssociationCodeCard
          key={manager.id}
          code={associationCode.code}
          loading={associationCode.loading}
          pending={associationCode.pending}
          error={associationCode.error}
          onRetry={associationCode.retry}
        />
      )}
      <DashboardFilters
        date={date}
        onDateChange={setDate}
        username={username}
        onUsernameChange={setUsername}
        users={users}
        usersAvailable={availability.users}
        tasks={taskAnalytics.tasks}
        tasksAvailable={taskAnalytics.tasksAvailable}
        tasksLoading={taskAnalytics.tasksLoading}
        tasksError={taskAnalytics.tasksError}
        taskId={taskId}
        onTaskChange={setTaskId}
        updatedAt={updatedAt}
        refreshing={refreshing}
      />
      {error && (
        <ErrorNotice className="mb-5" onRetry={refresh}>
          {error}
        </ErrorNotice>
      )}
      <DashboardMetrics
        loading={loading}
        available={availability}
        filtered={filteredTeam}
        summary={data?.summary}
        users={users}
        username={username}
      />
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <AttendanceSummary devApi={devApi} date={date} username={username} />
        <LastActivityTable
          people={filteredActivity}
          totalPeople={filteredTeam.length}
          loading={loading}
          available={availability.users && availability.realtime}
          processOptions={processOptions}
          selectedProcess={selectedProcess}
          onProcessChange={setSelectedProcess}
        />
        <CategorySummary
          categories={availability.summary ? categoryTotals(data.summary) : []}
          totalSeconds={availability.summary ? totalSeconds(data.summary) : 0}
          loading={loading}
          available={availability.summary}
        />
        <TaskSummaryCard
          demo={!!devApi}
          date={date}
          selectedTaskId={taskId}
          summary={taskAnalytics.summary}
          loading={taskAnalytics.summaryLoading}
          error={taskAnalytics.summaryError}
          onRetry={taskAnalytics.retry}
        />
      </section>
      {taskAnalytics.tasksError && devApi && (
        <ErrorNotice className="mt-5" onRetry={taskAnalytics.retry}>
          Lista demonstrativa de Tasks indisponível. {taskAnalytics.tasksError}
        </ErrorNotice>
      )}
      <p className="mt-5 text-sm muted">
        Atividades por Task e horas extras só serão exibidas quando houver registros vinculados na
        API; estados de atividade/inatividade não comprovam monitoramento em uma Task.
      </p>
    </>
  );
}
