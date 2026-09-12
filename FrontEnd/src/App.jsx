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
import {
  useActiveSection,
  useDashboardData,
  useTheme,
} from "./hooks";
import {
  formatDuration,
  getProductiveSeconds,
  getSummaryTotalSeconds,
  safeIsoDate,
} from "./utils/dashboard";

/**
 * Componente principal da aplicação
 * Dashboard de rastreamento de tempo para equipes
 */
function App() {
  const [dark, toggleTheme] = useTheme();
  const [selectedDate, setSelectedDate] = useState(() => safeIsoDate());
  const [selectedUsername, setSelectedUsername] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const activeSection = useActiveSection();
  const activeDate = safeIsoDate(selectedDate);
  const { data, loading, refreshing, error, updatedAt, refresh } =
    useDashboardData(activeDate, selectedUsername, autoRefresh);
  const summaryUsers = data?.summary?.users ?? [];
  const realtimePeople = (data?.realtime ?? []).filter(
    (person) => !selectedUsername || person.username === selectedUsername,
  );
  const users = data?.users ?? [];
  const totalMonitoredSeconds = getSummaryTotalSeconds(data?.summary);
  const onlinePeople = realtimePeople.filter(
    (person) => person.status === "online",
  ).length;
  const productiveSeconds = getProductiveSeconds(data?.summary);

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(new Date(`${activeDate}T12:00:00`))
    .toUpperCase();

  return (
    <div className="min-h-screen bg-page text-ink dark:bg-slate-950">
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <Sidebar activeSection={activeSection} />
      <main
        id="conteudo-principal"
        tabIndex="-1"
        className="mx-auto w-full max-w-[1610px] px-5 py-7 sm:px-8 lg:ml-64 lg:w-[calc(100%_-_16rem)] lg:px-12 lg:py-10"
      >
        <Header
          formattedDate={formattedDate}
          dark={dark}
          toggleTheme={toggleTheme}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedUsername={selectedUsername}
          setSelectedUsername={setSelectedUsername}
          users={users}
          apiStatus={loading ? "loading" : error ? "offline" : "online"}
          refreshing={refreshing}
          onRefresh={refresh}
          updatedAt={updatedAt}
        />

        {error && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            role="status"
            aria-live="polite"
          >
            <div>
              <strong className="block font-bold">Modo demonstração</strong>
              <span>API indisponível. Os dados exibidos podem ser fictícios.</span>
            </div>
            <button type="button" className="secondary-button" onClick={refresh}>
              Tentar novamente
            </button>
          </div>
        )}

        <section
          className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-labelledby="metricas-heading"
        >
          <h2 id="metricas-heading" className="sr-only">Métricas principais</h2>
          <MetricCard
            icon="◷"
            tone="bg-violet-100 text-violet-600"
            label="Tempo monitorado"
            value={data ? formatDuration(totalMonitoredSeconds) : "—"}
            detail={data ? "dados da API" : "aguardando dados"}
          />
          <MetricCard
            icon="⌁"
            tone="bg-blue-100 text-blue-600"
            label="Tempo produtivo"
            value={data ? formatDuration(productiveSeconds) : "—"}
            detail={data ? "categorias produtivas" : "aguardando dados"}
            positive={Boolean(data)}
          />
          <MetricCard
            icon="●"
            tone="bg-orange-100 text-orange-600"
            label="Em atividade agora"
            value={
              data ? (
                <>
                  {onlinePeople}{" "}
                  <span className="text-xs font-medium text-muted">pessoas</span>
                </>
              ) : "—"
            }
            detail={data ? `${realtimePeople.length} na equipe` : "aguardando dados"}
          />
          <MetricCard
            icon="◆"
            tone="bg-emerald-100 text-emerald-600"
            label="Software mais usado"
            value={data ? "Não disponível" : "—"}
            detail={data ? "endpoint ainda não disponível" : "aguardando dados"}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2" aria-label="Indicadores e atividade">
          <ActivityChart weeklySummaries={data?.weeklySummaries ?? []} useDemoData={!data} />
          <CategoryChart summaryUsers={summaryUsers} useDemoData={!data} />
          <AppsCard useDemoData={!data} />
          <TimelineCard useDemoData={!data} />
          <PeopleCard realtimePeople={realtimePeople} useDemoData={!data} />
        </section>

        {loading && (
          <p className="mt-4 text-xs text-muted" role="status" aria-live="polite">
            Consultando dados da API…
          </p>
        )}

        <div id="relatorios" className="mt-5 grid gap-5">
          <ReportsAndAgent
            selectedDate={activeDate}
            selectedUsername={selectedUsername}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            realtimePeople={realtimePeople}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
