import { timeline } from "../data/dashboardData";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente TimelineCard
 * Exibe a timeline do expediente com divisão de atividades
 */
export function TimelineCard() {
  return (
    <Card id="timeline" className="min-h-[257px] lg:col-span-2">
      <SectionHeading
        title="Timeline do expediente"
        description="Divisão das atividades monitoradas"
        action={<span className="text-xs text-muted">08:00 — 18:00</span>}
      />
      <div className="mt-7 flex h-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
        {timeline.map(([name, time, width, tone], index) => (
          <div
            key={`${name}-${index}`}
            className={`${tone} group relative flex min-w-0 items-center justify-center text-[10px] font-semibold text-white`}
            style={{ width: `${width}%` }}
            title={`${name}: ${time}`}
          >
            <span className="truncate px-1">{name}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>08:00</span>
        <span>10:00</span>
        <span>12:00</span>
        <span>14:00</span>
        <span>16:00</span>
        <span>18:00</span>
      </div>
    </Card>
  );
}
