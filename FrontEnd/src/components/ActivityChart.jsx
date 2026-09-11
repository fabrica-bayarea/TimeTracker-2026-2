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
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente ActivityChart
 * Gráfico de barras mostrando atividade semanal (monitorado vs produtivo)
 */
export function ActivityChart() {
  return (
    <Card className="min-h-[286px] lg:col-span-1">
      <SectionHeading
        title="Atividade da equipe"
        description="Tempo monitorado e produtivo"
        action={
          <button className="control">
            Últimos 7 dias <span>⌄</span>
          </button>
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
      <div
        className="mt-3 h-[190px]"
        aria-label="Gráfico de atividades semanais"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={week}
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
            <YAxis hide domain={[0, 80]} />
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
      </div>
    </Card>
  );
}
