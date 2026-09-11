/**
 * Componente Header
 * Cabeçalho da página com data, título e controles
 * @param {string} formattedDate - Data formatada
 * @param {boolean} dark - Se o tema escuro está ativo
 * @param {function} toggleTheme - Função para alternar tema
 * @param {string} selectedDate - Data selecionada
 * @param {function} setSelectedDate - Função para atualizar data
 */
export function Header({
  formattedDate,
  dark,
  toggleTheme,
  selectedDate,
  setSelectedDate,
}) {
  return (
    <header
      id="visao-geral"
      className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-start"
    >
      <div>
        <p className="eyebrow">{formattedDate} · DADOS AO VIVO</p>
        <h1 className="font-display text-[29px] font-extrabold text-ink dark:text-white">
          Visão geral da operação
        </h1>
        <p className="mt-2 text-sm text-muted">
          Acompanhe o ritmo da equipe e a atividade monitorada de hoje.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="icon-control"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          {dark ? "☀" : "☾"}
        </button>
        <button
          className="icon-control relative"
          aria-label="Notificações"
          title="Notificações"
        >
          ♧<i className="notification-dot" />
        </button>
        <label
          className="control flex items-center gap-2"
          title="Selecionar data"
        >
          ▣
          <input
            className="bg-transparent text-xs outline-none"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Data do relatório"
          />
        </label>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <i className="status-dot" />
          API online
        </span>
      </div>
    </header>
  );
}
