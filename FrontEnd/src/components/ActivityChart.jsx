import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { week } from "../data/dashboardData";
import { getProductiveSeconds, getSummaryTotalSeconds } from "../utils/dashboard";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente ActivityChart
 * Gráfico de barras mostrando atividade semanal (monitorado vs produtivo)
 */
export function ActivityChart({ weeklySummaries = [], useDemoData = true }) {
  const chartData = weeklySummaries.length
    ? weeklySummaries.map((summary) => {
        const monitored = Math.round((getSummaryTotalSeconds(summary) / 3600) * 10);
        const productive = Math.round(getProductiveSeconds(summary) / 3600 * 10);
        return {
          day: new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
            .format(new Date(`${summary.date}T12:00:00`))
            .replace(".", ""),
          monitored,
          productive,
          hours: `${(monitored / 10).toFixed(1)}h monitoradas`,
        };
      })
    : useDemoData
      ? week
      : [];
  const chartMaximum = Math.max(
    10,
    ...chartData.flatMap(({ monitored, productive }) => [monitored, productive]),
  );
  return (
    <Card id="atividade" className="min-h-[286px] lg:col-span-1">
      <SectionHeading
        title="Atividade da equipe"
        description="Tempo monitorado e produtivo"
        action={
          <span className="control inline-flex items-center" aria-label="Período exibido">
            Últimos 7 dias
          </span>
        }
      />
      <div className="mt-1 flex justify-end gap-4 text-[11px] text-muted">
        <span>
          <i className="legend-dot bg-violet-300" />
          Monitorado
        </span>
        <span>
          <i className="legend-dot bg-indigo-600" />
          Produtivo
        </span>
      </div>
      {chartData.length ? <div
        className="mt-3 h-[190px]"
        aria-label="Gráfico de atividades semanais"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barGap={4}
            margin={{ top: 12, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid stroke="#eff0f5" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8d91a1", fontSize: 11 }}
            />
            <YAxis hide domain={[0, Math.ceil(chartMaximum / 10) * 10]} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="chart-tooltip">
                    {payload[0].payload.hours}
                  </div>
                ) : null
              }
            />
            <Bar dataKey="monitored" fill="#b7aff7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="productive" fill="#6350df" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <div className="grid h-[190px] place-items-center text-center text-xs text-muted">
        O backend ainda não disponibiliza o histórico semanal necessário para este gráfico.
      </div>}
    </Card>
  );
}
