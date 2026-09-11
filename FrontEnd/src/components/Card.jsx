/**
 * Componente Card
 * @param {React.ReactNode} children - Conteúdo do card
 * @param {string} className - Classes CSS adicionais
 * @param {string} id - ID do elemento
 */
export function Card({ children, className = "", id }) {
  return (
    <article
      id={id}
      className={`min-w-0 rounded-[13px] border border-line bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {children}
    </article>
  );
}
