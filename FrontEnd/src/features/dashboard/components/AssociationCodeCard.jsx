import { useEffect, useRef, useState } from 'react';

const ASSOCIATION_CODE_PATTERN = /^\d{6}$/;

export function AssociationCodeCard({
  code = null,
  loading = false,
  pending = false,
  error = null,
  onRetry,
}) {
  const [feedback, setFeedback] = useState('');
  const currentCode = useRef(code);
  const validCode = typeof code === 'string' && ASSOCIATION_CODE_PATTERN.test(code);

  useEffect(() => {
    currentCode.current = code;
    setFeedback('');
  }, [code]);

  async function copyCode() {
    if (!validCode) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API indisponível');
      await navigator.clipboard.writeText(code);
      if (currentCode.current === code) setFeedback('Copiado!');
    } catch {
      if (currentCode.current === code) setFeedback('Não foi possível copiar o código.');
    }
  }

  return (
    <section className="card mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="eyebrow">Acesso da equipe</p>
        <h2 className="text-lg font-extrabold">Código de associação</h2>
        {loading ? (
          <p
            className="mt-1 text-sm muted"
            role="status"
            aria-label="Carregando código de associação"
          >
            Carregando código…
          </p>
        ) : validCode ? (
          <p
            className="mt-1 font-mono text-3xl font-bold tracking-[0.2em]"
            aria-label="Código de associação"
          >
            {code}
          </p>
        ) : error ? (
          <p className="mt-1 text-sm muted" role="alert">
            {error}
          </p>
        ) : pending ? (
          <p className="mt-1 text-sm muted" role="note" aria-live="polite">
            A consulta depende de um contrato de código de associação que o Backend ainda não
            disponibiliza.
          </p>
        ) : (
          <p className="mt-1 text-sm muted" role="note" aria-live="polite">
            Código de associação indisponível.
          </p>
        )}
        {validCode && (
          <p className="mt-1 text-xs muted">
            Compartilhe este código com os membros da sua equipe.
          </p>
        )}
        <p
          className="mt-2 min-h-5 text-sm"
          role={feedback ? 'status' : undefined}
          aria-live="polite"
          aria-atomic="true"
        >
          {feedback}
        </p>
        {error && onRetry && (
          <button
            type="button"
            className="secondary-button mt-2"
            onClick={onRetry}
            disabled={loading}
          >
            Tentar novamente
          </button>
        )}
      </div>
      <button
        type="button"
        className="primary-button min-h-11 w-full sm:w-auto"
        onClick={copyCode}
        disabled={!validCode || loading}
        aria-label="Copiar código de associação"
      >
        Copiar Código
      </button>
    </section>
  );
}
