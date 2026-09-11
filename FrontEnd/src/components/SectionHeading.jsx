/**
 * Componente SectionHeading
 * Exibe o título e descrição de uma seção com ação
 * @param {string} title - Título da seção
 * @param {string} description - Descrição da seção
 * @param {React.ReactNode} action - Elemento de ação (botão, link, etc)
 */
export function SectionHeading({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-base font-bold text-ink dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
