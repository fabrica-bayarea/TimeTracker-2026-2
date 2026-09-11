import { safeIsoDate } from "../utils/dashboard";

/** Cabeçalho com filtros, status da API e controles de atualização. */
export function Header({
  formattedDate, dark, toggleTheme, selectedDate, setSelectedDate, apiStatus,
  selectedUsername, setSelectedUsername, users, refreshing, onRefresh, updatedAt,
}) {
  const apiStatusLabel = {
    loading: "Conectando à API",
    offline: "API offline",
    online: "API online",
  }[apiStatus] || "API offline";

  return (
    <header id="visao-geral" className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
      <div>
        <p className="eyebrow">{formattedDate} · DADOS AO VIVO</p>
        <h1 className="font-display text-[29px] font-extrabold text-ink dark:text-white">Visão geral da operação</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Acompanhe o ritmo da equipe e a atividade monitorada de hoje.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3" aria-label="Filtros e controles do painel">
        <button
          type="button"
          className="icon-control"
          onClick={toggleTheme}
          aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
          aria-pressed={dark}
          title={dark ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
        </button>
        <button
          type="button"
          className="icon-control"
          onClick={onRefresh}
          disabled={refreshing || apiStatus === "loading"}
          aria-label={refreshing ? "Atualizando dados" : "Atualizar dados agora"}
          title={refreshing ? "Atualizando dados" : "Atualizar dados agora"}
        >
          <span aria-hidden="true" className={refreshing ? "animate-spin" : ""}>↻</span>
        </button>
        <label className="control gap-2" title="Selecionar data">
          <span aria-hidden="true">▣</span>
          <input
            className="min-w-0 bg-transparent text-xs outline-none"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            max={safeIsoDate()}
            aria-label="Data do relatório"
          />
        </label>
        <label className="control gap-2" title="Filtrar colaborador">
          <span aria-hidden="true">♙</span>
          <select
            className="min-w-0 max-w-[190px] bg-transparent text-xs outline-none dark:bg-slate-900"
            value={selectedUsername}
            onChange={(event) => setSelectedUsername(event.target.value)}
            aria-label="Filtrar colaborador"
          >
            <option value="" className="dark:bg-slate-900 dark:text-slate-200">Toda a equipe</option>
            {users.map((user) => (
              <option key={user.username} value={user.username} className="dark:bg-slate-900 dark:text-slate-200">
                {user.full_name || user.username}
              </option>
            ))}
          </select>
        </label>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${apiStatus === "online" ? "text-emerald-600" : "text-amber-600"}`}
          role="status"
          aria-live="polite"
        >
          <i className="status-dot" aria-hidden="true" />
          {apiStatusLabel}
        </span>
        {updatedAt && (
          <span className="w-full text-right text-[10px] text-muted" aria-live="polite">
            Atualizado às {updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </header>
  );
}
