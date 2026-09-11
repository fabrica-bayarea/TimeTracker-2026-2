import { AVATAR_COLOR_PALETTE, USER_STATUS_LABELS } from "../constants/ui";
import { people as demoPeople } from "../data/dashboardData";
import { formatRelativeActivityTime } from "../utils/dashboard";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/**
 * @typedef {Object} RealtimePerson
 * @property {string} username - Identificador do colaborador
 * @property {string} [hostname] - Nome da máquina
 * @property {string} [process_name] - Nome do executável ou aplicação em primeiro plano
 * @property {string} [window_title] - Título da janela ativa
 * @property {string} [category] - Categoria da atividade (ex: Desenvolvimento, Comunicação)
 * @property {"online"|"idle"|"offline"} [status] - Status de presença
 * @property {number} [seconds_since_last_activity] - Segundos decorridos desde a última interação
 */

/**
 * @typedef {Object} PeopleCardProps
 * @property {RealtimePerson[]} [realtimePeople=[]] - Lista de colaboradores monitorados em tempo real
 * @property {boolean} [useDemoData=true] - Se deve usar dados de demonstração caso realtimePeople esteja vazio
 */

/**
 * Componente PeopleCard
 * Tabela exibindo os colaboradores da equipe em atividade em tempo real.
 *
 * @param {PeopleCardProps} props
 */
export function PeopleCard({ realtimePeople = [], useDemoData = true }) {
  const people = realtimePeople.length
    ? realtimePeople.map((person, index) => {
        const username = String(person.username || "Desconhecido");
        const secondsSinceLastActivity = Math.max(
          0,
          Number(person.seconds_since_last_activity) || 0,
        );
        const statusLabel =
          USER_STATUS_LABELS[person.status] ||
          (person.status === "online" ? "Online" : "Ausente");
        const avatarColor =
          AVATAR_COLOR_PALETTE[index % AVATAR_COLOR_PALETTE.length];

        return [
          username,
          username.slice(0, 2).toUpperCase(),
          person.hostname || "—",
          person.process_name || "—",
          person.window_title || "Sem título de janela",
          person.category || "Outros",
          statusLabel,
          formatRelativeActivityTime(secondsSinceLastActivity),
          avatarColor,
        ];
      })
    : useDemoData
      ? demoPeople
      : [];

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
      <div
        className="-mx-5 mt-5 overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand"
        tabIndex={0}
        aria-label="Tabela de colaboradores em atividade com rolagem horizontal"
      >
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
            {people.length ? (
              people.map(
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
                      <small className="block truncate max-w-[280px]" title={windowName}>
                        {windowName}
                      </small>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`pill ${
                          category === "Comunicação"
                            ? "communication"
                            : category === "Design"
                              ? "design"
                              : ""
                        }`}
                      >
                        {category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`flex items-center gap-1.5 font-bold ${
                          status === "Online"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        <i className="status-dot" />
                        {status}
                      </span>
                      <small className="mt-1 block">{time}</small>
                    </td>
                  </tr>
                ),
              )
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-xs text-muted">
                  Nenhuma atividade em tempo real encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
