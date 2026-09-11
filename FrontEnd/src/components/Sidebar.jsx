import { useState } from "react";
import { navItems } from "../data/dashboardData";

/**
 * Componente Sidebar
 * Barra de navegação lateral com menu principal
 * Inclui suporte a menu mobile via drawer/overlay
 * @param {string} activeSection - ID da seção ativa
 */
export function Sidebar({ activeSection }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <a
        href="#visao-geral"
        className="flex items-center gap-2 font-display text-[21px] font-extrabold text-ink dark:text-white"
        onClick={() => setMobileOpen(false)}
      >
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-white">
          T
        </span>
        <span>
          time<span className="text-brand">track</span>
        </span>
      </a>
      <nav className="mt-12 grid gap-1" aria-label="Menu principal">
        {navItems.map(([id, icon, label]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition-colors ${activeSection === id ? "bg-indigo-50 text-brand dark:bg-indigo-950/50" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <span className="w-5 text-center text-lg">{icon}</span>
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto border-t border-line pt-4 dark:border-slate-700">
        <span
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold text-slate-400"
          title="Configurações ainda não disponíveis"
        >
          <span className="w-5 text-center text-lg">⚙</span>Configurações
        </span>
        <div className="mt-4 flex items-center gap-2 px-1">
          <div className="avatar bg-violet-100 text-violet-700">LM</div>
          <div>
            <strong className="block text-xs text-ink dark:text-white">
              Luan Menezes
            </strong>
            <small className="mt-1 block text-xs text-muted">
              Administrador
            </small>
          </div>
          <span className="ml-auto text-slate-400">•••</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Botão hamburger — visível apenas em telas < lg */}
      <button
        type="button"
        className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-lg text-slate-600 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        title="Abrir menu"
      >
        ☰
      </button>

      {/* Sidebar desktop — fixa, visível apenas em lg+ */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-white px-4 py-7 dark:border-slate-700 dark:bg-slate-900 lg:flex">
        {sidebarContent}
      </aside>

      {/* Overlay + Sidebar mobile — visível apenas quando aberto em < lg */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop escuro */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer lateral */}
          <aside className="absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white px-4 py-7 shadow-xl animate-slide-in dark:border-slate-700 dark:bg-slate-900">
            {/* Botão fechar */}
            <button
              type="button"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              ✕
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
