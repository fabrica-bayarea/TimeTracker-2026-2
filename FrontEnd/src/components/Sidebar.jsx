import { useState } from "react";
import { navItems as defaultNavItems } from "../data/dashboardData";

/**
 * @typedef {Object} SidebarProps
 * @property {string} activeSection - ID da seção atualmente ativa na página
 * @property {Array<[id: string, icon: string, label: string]>} [items=defaultNavItems] - Itens de navegação
 */

/**
 * Componente Sidebar
 * Barra de navegação lateral fixa para desktop e drawer responsivo para mobile.
 *
 * @param {SidebarProps} props
 */
export function Sidebar({ activeSection, items = defaultNavItems }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <a
        href="#visao-geral"
        onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-lg text-slate-600 shadow-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        title="Abrir menu"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-white px-4 py-7 dark:border-slate-700 dark:bg-slate-900 lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white px-4 py-7 shadow-xl animate-slide-in dark:border-slate-700 dark:bg-slate-900"
            aria-label="Menu principal mobile"
          >
            <button
              type="button"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              title="Fechar menu"
            >
              <span aria-hidden="true">✕</span>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
