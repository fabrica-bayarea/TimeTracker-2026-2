import { Card } from "./Card";

/**
 * Componente MetricCard
 * Exibe uma métrica com ícone, valor e detalhe
 * @param {React.ReactNode} icon - Ícone da métrica
 * @param {string} tone - Classe de cor/tom do ícone
 * @param {string} label - Rótulo da métrica
 * @param {React.ReactNode} value - Valor principal
 * @param {string} detail - Texto de detalhe
 * @param {boolean} positive - Se o detalhe deve mostrar em cor positiva
 */
export function MetricCard({ icon, tone, label, value, detail, positive }) {
  return (
    <Card className="flex min-h-[131px] items-start gap-3.5 p-5">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl font-bold ${tone}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <h2 className="mt-1 font-display text-[23px] font-extrabold text-ink dark:text-white">
          {value}
        </h2>
        <small
          className={`text-[11px] font-semibold ${positive ? "text-emerald-600" : "text-muted"}`}
        >
          {detail}
        </small>
      </div>
    </Card>
  );
}
