import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { categories as demoCategories } from "../data/dashboardData";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente CategoryChart
 * Gráfico de pizza mostrando tempo por categoria de atividade
 */
export function CategoryChart({ summaryUsers = [], useDemoData = true }) {
  const categoryMap = new Map();

  summaryUsers.forEach((user) => {
    (user.by_category ?? []).forEach((category) => {
      const current = categoryMap.get(category.category) ?? {
        name: category.category,
        value: 0,
        color: category.color,
      };
      current.value += category.total_seconds;
      categoryMap.set(category.category, current);
    });
  });

  const categories = categoryMap.size
    ? [...categoryMap.values()].map((category) => ({
        ...category,
        time: `${Math.floor(category.value / 3600)}h ${Math.floor((category.value % 3600) / 60)}min`,
      }))
    : useDemoData
      ? demoCategories
      : [];
  const totalSeconds = categories.reduce((total, category) => total + category.value, 0);
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
              {Math.floor(totalSeconds / 3600)}h {String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")}
            </strong>
            <span className="text-[10px] text-muted">monitoradas</span>
          </div>
        </div>
        <div className="grid gap-3.5">
          {categories.length ? categories.map((category) => (
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
          )) : <p className="max-w-32 text-center text-xs text-muted">Sem atividades classificadas nesta data.</p>}
        </div>
      </div>
    </Card>
  );
}
