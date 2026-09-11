import { useState } from "react";
import {
  ActivityChart,
  AppsCard,
  CategoryChart,
  Header,
  MetricCard,
  PeopleCard,
  ReportsAndAgent,
  Sidebar,
  TimelineCard,
} from "./components";
import { useActiveSection, useTheme } from "./hooks/useDashboard";

/**
 * Componente principal da aplicação
 * Dashboard de rastreamento de tempo para equipes
 */
function App() {
  const [dark, toggleTheme] = useTheme();
  const [selectedDate, setSelectedDate] = useState("2026-09-06");
  const [tracking, setTracking] = useState(true);
  const activeSection = useActiveSection();

  // Formata a data para exibição
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(new Date(`${selectedDate}T12:00:00`))
    .toUpperCase();

  return (
    <div className="min-h-screen bg-page text-ink dark:bg-slate-950">
      <Sidebar activeSection={activeSection} />
      <main className="mx-auto w-full max-w-[1610px] px-5 py-7 sm:px-8 lg:ml-64 lg:w-[calc(100%_-_16rem)] lg:px-12 lg:py-10">
        {/* Header com título, filtros e controles */}
        <Header
          formattedDate={formattedDate}
          dark={dark}
          toggleTheme={toggleTheme}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {/* Cards de métricas */}
        <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon="◷"
            tone="bg-violet-100 text-violet-600"
            label="Tempo monitorado"
            value="6h 42min"
            detail="↑ 12%  vs. ontem"
            positive
          />
          <MetricCard
            icon="⌁"
            tone="bg-blue-100 text-blue-600"
            label="Tempo produtivo"
            value="5h 18min"
            detail="↑ 8%  vs. ontem"
            positive
          />
          <MetricCard
            icon="●"
            tone="bg-orange-100 text-orange-600"
            label="Em atividade agora"
            value={
              <>
                12{" "}
                <span className="text-xs font-medium text-muted">pessoas</span>
              </>
            }
            detail="de 16 na equipe"
          />
          <MetricCard
            icon="◆"
            tone="bg-emerald-100 text-emerald-600"
            label="Software mais usado"
            value="VS Code"
            detail="2h 42min monitoradas"
          />
        </section>

        {/* Seção de gráficos e tabelas */}
        <section className="grid gap-5 lg:grid-cols-2">
          <ActivityChart />
          <CategoryChart />
          <AppsCard />
          <TimelineCard />
          <PeopleCard />
        </section>

        {/* Seção de relatórios e agente */}
        <div className="mt-5 grid gap-5">
          <ReportsAndAgent tracking={tracking} setTracking={setTracking} />
        </div>
      </main>
    </div>
  );
}

export default App;
