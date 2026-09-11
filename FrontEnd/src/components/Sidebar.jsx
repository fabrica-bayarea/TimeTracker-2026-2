import { navItems as defaultNavItems } from "../data/dashboardData";

/**
 * @typedef {Object} SidebarProps
 * @property {string} activeSection - ID da seção atualmente ativa na página
 * @property {Array<[id: string, icon: string, label: string]>} [items=defaultNavItems] - Itens de navegação
 */

/**
 * Componente Sidebar
 * Barra de navegação lateral fixa para desktop (a partir de 1024px) com logo, links de seção e perfil.
 *
 * @param {SidebarProps} props
 */
export function Sidebar({ activeSection, items = defaultNavItems }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-white px-4 py-7 dark:border-slate-700 dark:bg-slate-900 lg:flex">
      <a
        href="#visao-geral"
        className="flex items-center gap-2 rounded-lg font-display text-[21px] font-extrabold text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:text-white"
        aria-label="TimeTrack — voltar para a visão geral"
      >
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-white">
          T
        </span>
        <span>
          time<span className="text-brand">track</span>
        </span>
      </a>

      <nav className="mt-12 grid gap-1" aria-label="Menu principal">
        {items.map(([id, icon, label]) => {
          const isActive = activeSection === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-indigo-50 text-brand dark:bg-indigo-950/50"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span aria-hidden="true" className="w-5 text-center text-lg">
                {icon}
              </span>
              {label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line pt-4 dark:border-slate-700">
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-semibold text-slate-400"
          title="Configurações ainda não disponíveis"
          aria-label="Configurações — indisponível"
        >
          <span aria-hidden="true" className="w-5 text-center text-lg">
            ⚙
          </span>
          Configurações
        </button>
        <div className="mt-4 flex items-center gap-2 px-1" aria-label="Usuário atual">
          <div className="avatar bg-violet-100 text-violet-700" aria-hidden="true">
            LM
          </div>
          <div>
            <strong className="block text-xs text-ink dark:text-white">Luan Menezes</strong>
            <small className="mt-1 block text-xs text-muted">Administrador</small>
          </div>
          <span className="ml-auto text-slate-400" aria-hidden="true">
            •••
          </span>
        </div>
      </div>
    </aside>
  );
}
