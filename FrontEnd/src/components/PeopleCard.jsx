import { people as demoPeople } from "../data/dashboardData";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * Componente PeopleCard
 * Tabela exibindo colaboradores em atividade
 */
export function PeopleCard({ realtimePeople = [] }) {
  const people = realtimePeople.length
    ? realtimePeople.map((person, index) => [
        person.username,
        person.username.slice(0, 2).toUpperCase(),
        person.hostname,
        person.process_name,
        person.window_title || "Sem título de janela",
        person.category || "Outros",
        person.status === "online" ? "Online" : "Ausente",
        `há ${person.seconds_since_last_activity}s`,
        ["bg-rose-300", "bg-blue-300", "bg-pink-300", "bg-emerald-300", "bg-yellow-300", "bg-cyan-300"][index % 6],
      ])
    : demoPeople;
  return (
    <Card id="equipe" className="overflow-hidden p-5 lg:col-span-2">
      <SectionHeading
        title="Equipe em atividade"
        description="Última leitura de cada colaborador"
        action={
          <a href="#timesheet" className="text-xs font-bold text-brand">
            Ver equipe <span>→</span>
          </a>
        }
      />
      <div className="-mx-5 mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-slate-800">
              <th className="px-5 py-2.5">Colaborador</th>
              <th className="px-5 py-2.5">Máquina</th>
              <th className="px-5 py-2.5">Aplicativo / janela</th>
              <th className="px-5 py-2.5">Categoria</th>
              <th className="px-5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {people.map(
              ([
                name,
                initials,
                machine,
                app,
                windowName,
                category,
                status,
                time,
                avatar,
              ]) => (
                <tr
                  key={name}
                  className="border-t border-slate-100 text-[11px] text-muted dark:border-slate-700"
                >
                  <td className="px-5 py-3">
                    <div className="flex min-w-[155px] items-center gap-2">
                      <div className={`avatar ${avatar}`}>{initials}</div>
                      <strong className="text-xs text-ink dark:text-white">
                        {name}
                      </strong>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px]">{machine}</td>
                  <td className="px-5 py-3">
                    <strong className="block text-xs text-ink dark:text-white">
                      {app}
                    </strong>
                    <small>{windowName}</small>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`pill ${category === "Comunicação" ? "communication" : category === "Design" ? "design" : ""}`}
                    >
                      {category}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`flex items-center gap-1.5 font-bold ${status === "Online" ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      <i className="status-dot" />
                      {status}
                    </span>
                    <small className="mt-1 block">{time}</small>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
