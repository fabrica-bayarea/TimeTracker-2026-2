/** Cabeçalho com filtros, status da API e controles de atualização. */
function getLocalIsoDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function Header({
  formattedDate, dark, toggleTheme, selectedDate, setSelectedDate, apiStatus,
  selectedUsername, setSelectedUsername, users, refreshing, onRefresh, updatedAt,
}) {
  const apiStatusLabel = {
    loading: "Conectando à API", offline: "API offline", online: "API online",
  }[apiStatus] || "API offline";

  return (
    <header id="visao-geral" className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
      <div>
        <p className="eyebrow">{formattedDate} · DADOS AO VIVO</p>
        <h1 className="font-display text-[29px] font-extrabold text-ink dark:text-white">Visão geral da operação</h1>
        <p className="mt-2 text-sm text-muted">Acompanhe o ritmo da equipe e a atividade monitorada de hoje.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="icon-control" onClick={toggleTheme} aria-label="Alternar tema" title="Alternar tema">
          {dark ? "☀" : "☾"}
        </button>
        <button
          type="button"
          className="icon-control"
          onClick={onRefresh}
          disabled={refreshing || apiStatus === "loading"}
          aria-label="Atualizar dados"
          title="Atualizar dados"
        >
          ↻
        </button>
        <label className="control flex items-center gap-2" title="Selecionar data">
          ▣
          <input
            className="bg-transparent text-xs outline-none"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            max={getLocalIsoDate()}
            aria-label="Data do relatório"
          />
        </label>
        <label className="control flex items-center gap-2" title="Filtrar colaborador">
          <span aria-hidden="true">♙</span>
          <select
            className="bg-transparent text-xs outline-none"
            value={selectedUsername}
            onChange={(event) => setSelectedUsername(event.target.value)}
            aria-label="Filtrar colaborador"
          >
            <option value="">Toda a equipe</option>
            {users.map((user) => (
              <option key={user.username} value={user.username}>
                {user.full_name || user.username}
              </option>
            ))}
          </select>
        </label>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${apiStatus === "online" ? "text-emerald-600" : "text-amber-600"}`}>
          <i className="status-dot" />
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
