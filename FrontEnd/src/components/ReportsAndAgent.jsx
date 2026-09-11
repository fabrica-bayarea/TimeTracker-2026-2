import { people } from "../data/dashboardData";
import {
  convertRowsToCsv,
  createDailyReport,
  downloadTextFile,
} from "../utils/report";

/**
 * Componente ReportsAndAgent
 * Seção de relatórios e status do agente TimeTrack
 * @param {boolean} tracking - Se o rastreamento está ativo
 * @param {function} setTracking - Função para atualizar o estado do rastreamento
 */
export function ReportsAndAgent({ tracking, setTracking }) {
  const handleDownloadCsv = () => {
    const report = createDailyReport(people);
    const csv = convertRowsToCsv(report);

    downloadTextFile(
      csv,
      "timetrack-relatorio-diario.csv",
      "text/csv;charset=utf-8",
    );
  };

  return (
    <>
      <section
        id="relatorios"
        className="flex flex-col items-start justify-between gap-4 rounded-[13px] border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl text-brand shadow-sm">
            ↓
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Relatório diário
            </h2>
            <p className="mt-1 text-xs text-muted">
              Exporte a atividade consolidada da equipe.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="secondary-button" onClick={handleDownloadCsv}>
            ⇩ CSV
          </button>
          <button className="primary-button" onClick={() => window.print()}>
            ▣ PDF
          </button>
        </div>
      </section>
      <section
        id="timesheet"
        className="flex flex-col items-start justify-between gap-4 rounded-[13px] border border-line bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            ⌁
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Agente TimeTrack conectado{" "}
              <span className="pill online-badge">● Online</span>
            </h2>
            <p className="mt-1 text-xs text-muted">
              Windows · LAPTOP-LUAN · última sincronização há 12s
            </p>
          </div>
        </div>
        <button
          className="primary-button"
          onClick={() => setTracking(!tracking)}
        >
          {tracking ? "❚❚ Pausar acompanhamento" : "▶ Retomar acompanhamento"}
        </button>
      </section>
    </>
  );
}
