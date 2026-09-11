import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { categories } from "../data/dashboardData";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente CategoryChart
 * Gráfico de pizza mostrando tempo por categoria de atividade
 */
export function CategoryChart() {
  return (
    <Card className="min-h-[286px]">
      <SectionHeading
        title="Tempo por categoria"
        description="Classificação por palavras-chave"
        action={
          <button className="icon-control" aria-label="Mais opções">
            •••
          </button>
        }
      />
      <div className="mt-5 flex items-center justify-center gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="value"
                innerRadius={51}
                outerRadius={69}
                paddingAngle={1}
                strokeWidth={0}
              >
                {categories.map((category) => (
                  <Cell key={category.name} fill={category.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-content-center text-center">
            <strong className="font-display text-[23px] text-ink dark:text-white">
              6h 42
            </strong>
            <span className="text-[10px] text-muted">monitoradas</span>
          </div>
        </div>
        <div className="grid gap-3.5">
          {categories.map((category) => (
            <div key={category.name} className="text-[11px] text-muted">
              <span>
                <i
                  className="legend-dot"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
              <strong className="mt-1 block text-xs text-ink dark:text-white">
                {category.time}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
