import { people as demoPeople } from "../data/dashboardData";
import { convertRowsToCsv, createDailyReport, downloadTextFile } from "../utils/report";

/** Exportação local e preferências de atualização; não altera o agente nem a API. */
export function ReportsAndAgent({
  realtimePeople = [], useDemoData, selectedDate, autoRefresh, setAutoRefresh,
}) {
  const reportPeople = realtimePeople.length
    ? realtimePeople.map((person) => [
        person.username,
        person.username.slice(0, 2).toUpperCase(),
        person.hostname,
        person.process_name,
        person.window_title || "Sem título de janela",
        person.category || "Outros",
        person.status === "online" ? "Online" : "Ausente",
        "",
        "",
      ])
    : useDemoData ? demoPeople : [];

  const handleDownloadCsv = () => {
    downloadTextFile(
      convertRowsToCsv(createDailyReport(reportPeople)),
      `timetrack-relatorio-${selectedDate}.csv`,
      "text/csv;charset=utf-8",
    );
  };

  return (
    <>
      <section id="relatorios" className="flex flex-col items-start justify-between gap-4 rounded-[13px] border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl text-brand shadow-sm">↓</span>
          <div>
            <h2 className="font-display text-base font-bold text-ink dark:text-white">Relatório diário</h2>
            <p className="mt-1 text-xs text-muted">Exporte as atividades visíveis no painel.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="secondary-button" onClick={handleDownloadCsv}>⇩ CSV</button>
          <button className="primary-button" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      </section>
      <section id="timesheet" className="flex flex-col items-start justify-between gap-4 rounded-[13px] border border-line bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-xl text-emerald-600">↻</span>
          <div>
            <h2 className="font-display text-base font-bold text-ink dark:text-white">Atualização do painel</h2>
            <p className="mt-1 text-xs text-muted">Consulta os endpoints já disponíveis a cada 30 segundos.</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-xs font-bold text-ink dark:text-white">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />
          Atualização automática
        </label>
      </section>
    </>
  );
}
