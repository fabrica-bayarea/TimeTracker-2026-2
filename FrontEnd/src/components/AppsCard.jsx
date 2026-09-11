import { apps } from "../data/dashboardData";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente AppsCard
 * Card exibindo os aplicativos mais usados com barras de progresso
 */
export function AppsCard({ useDemoData = true }) {
  return (
    <Card className="min-h-[257px]">
      <SectionHeading
        title="Aplicativos mais usados"
        description="Hoje, por tempo de uso"
        action={
          <a href="#relatorios" className="text-xs font-bold text-brand">
            Ver relatório <span>→</span>
          </a>
        }
      />
      {useDemoData ? <div className="mt-5 grid gap-4">
        {apps.map((app) => (
          <div
            key={app.name}
            className="grid grid-cols-[155px_1fr_59px] items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2 font-semibold text-ink dark:text-white">
              <span
                className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-white ${app.tone}`}
              >
                {app.symbol}
              </span>
              {app.name}
            </div>
            <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${app.percent}%` }}
              />
            </div>
            <strong className="text-right text-[11px] text-ink dark:text-white">
              {app.time}
            </strong>
          </div>
        ))}
      </div> : <p className="mt-8 text-center text-xs text-muted">
        O backend ainda não disponibiliza o ranking de aplicativos por período.
      </p>}
    </Card>
  );
}
