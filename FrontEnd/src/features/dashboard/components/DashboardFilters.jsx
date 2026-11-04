import { todayIso } from '../../../shared/lib/date';

export function DashboardFilters({
  date,
  onDateChange,
  username,
  onUsernameChange,
  users,
  usersAvailable,
  tasks = [],
  tasksAvailable = false,
  tasksLoading = false,
  tasksError = null,
  taskId = '',
  onTaskChange,
  updatedAt,
  refreshing,
}) {
  return (
    <section
      className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Filtros do resumo"
    >
      <label className="text-xs font-semibold muted">
        Data do resumo
        <input
          className="form-field mt-1"
          type="date"
          value={date}
          max={todayIso()}
          onChange={(event) => event.target.value && onDateChange(event.target.value)}
        />
      </label>
      <label className="text-xs font-semibold muted">
        Usuário
        <select
          className="form-field mt-1"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          disabled={!usersAvailable}
        >
          <option value="">Todos os usuários</option>
          {username && !users.some((user) => user.username === username) && (
            <option value={username}>{username} (selecionado)</option>
          )}
          {users.map((user) => (
            <option key={user.username} value={user.username}>
              {user.full_name || user.username}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold muted">
        Task (resumo por Task)
        <select
          className="form-field mt-1"
          value={taskId}
          onChange={(event) => onTaskChange(event.target.value)}
          disabled={!tasksAvailable || tasksLoading || tasks.length === 0}
          aria-describedby="task-filter-help"
        >
          <option value="">
            {tasksLoading
              ? 'Carregando Tasks…'
              : tasksError
                ? 'Lista de Tasks indisponível'
                : tasks.length === 0
                  ? 'Nenhuma Task disponível'
                  : 'Todas as Tasks'}
          </option>
          {tasksAvailable &&
            tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
        </select>
        <span id="task-filter-help" className="mt-1 block text-xs font-normal muted">
          Não altera os indicadores gerais; a consolidação real por Task aguarda a API.
        </span>
      </label>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onDateChange(todayIso())}
          disabled={date === todayIso()}
        >
          Hoje
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onUsernameChange('')}
          disabled={!username}
        >
          Limpar usuário
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onTaskChange('')}
          disabled={!taskId}
        >
          Limpar Task
        </button>
        {(username || date !== todayIso() || taskId) && (
          <span className="self-center text-xs font-semibold text-brand">Filtro ativo</span>
        )}
        <p className="self-center text-xs muted">
          {updatedAt
            ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Aguardando primeira atualização'}
          {refreshing && ' · atualizando'}
        </p>
      </div>
    </section>
  );
}
