import { Suspense, useEffect, useRef } from 'react';
import { Sidebar } from './layout/Sidebar';
import { useTheme } from './hooks/useTheme';
import { useHashRoute } from './hooks/useHashRoute';
import { PageErrorBoundary } from './PageErrorBoundary';
import { routes } from './routes';
import { MocksNotice } from './layout/MocksNotice';
import { ManagerSessionProvider, useManagerSession } from '../shared/auth/ManagerSession';

export default function App({ mocksEnabled = false, devApi = null, authClient }) {
  return (
    <ManagerSessionProvider client={authClient}>
      <AppContent mocksEnabled={mocksEnabled} devApi={devApi} />
    </ManagerSessionProvider>
  );
}

function AppContent({ mocksEnabled, devApi }) {
  const route = useHashRoute();
  const [dark, toggleTheme] = useTheme();
  const session = useManagerSession();
  const main = useRef(null);
  const previousRoute = useRef(route);
  const config = routes[route];
  const Page = config?.component;

  useEffect(() => {
    document.title = `${config?.title || 'Página não encontrada'} | TimeTrack`;
    if (previousRoute.current !== route) main.current?.focus();
    previousRoute.current = route;
  }, [route, config]);

  useEffect(() => {
    if (config?.protected && session.status === 'anonymous') {
      window.location.hash = '#/login';
    } else if (config?.auth && session.status === 'authenticated') {
      window.location.hash = '#/painel';
    }
  }, [config, session.status]);

  const content = Page ? (
    <PageErrorBoundary key={route}>
      <Suspense fallback={<p role="status">Carregando interface…</p>}>
        <Page
          dark={dark}
          toggleTheme={toggleTheme}
          mode={route}
          devApi={devApi}
          manager={config?.protected ? session.manager : null}
        />
      </Suspense>
    </PageErrorBoundary>
  ) : (
    <section className="card">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-sm muted">
        O endereço informado não corresponde a uma página do TimeTrack.
      </p>
      <a className="mt-4 inline-block font-semibold text-brand underline" href="#/painel">
        Ir para o painel
      </a>
    </section>
  );

  if (config?.protected && session.status !== 'authenticated') {
    return (
      <main
        ref={main}
        tabIndex="-1"
        className="grid min-h-screen place-items-center bg-page p-4 dark:bg-slate-950 dark:text-white"
      >
        {session.status === 'checking' ? (
          <p role="status">Validando a sessão do gestor…</p>
        ) : session.status === 'unavailable' ? (
          <section className="card w-full max-w-lg p-6" aria-labelledby="session-error-title">
            <h1 id="session-error-title" className="text-xl font-bold">
              Não foi possível validar a sessão
            </h1>
            <p className="mt-2 text-sm muted">
              A API não respondeu. Tente novamente para continuar com segurança.
            </p>
            <button className="primary-button mt-5" onClick={() => void session.retrySession()}>
              Tentar novamente
            </button>
            <a className="secondary-button ml-2 inline-block" href="#/login">
              Ir para entrar
            </a>
          </section>
        ) : (
          <p role="status">Redirecionando para entrar…</p>
        )}
      </main>
    );
  }

  if (config?.auth && session.status === 'authenticated') {
    return (
      <main ref={main} tabIndex="-1" className="grid min-h-screen place-items-center p-4">
        <p role="status">Abrindo o painel…</p>
      </main>
    );
  }

  if (config?.auth)
    return (
      <main
        ref={main}
        tabIndex="-1"
        className="grid min-h-screen place-items-center bg-page p-4 dark:bg-slate-950 dark:text-white"
      >
        <MocksNotice enabled={mocksEnabled} />
        {content}
      </main>
    );

  return (
    <div className="min-h-screen bg-page text-ink dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#conteudo"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Pular para o conteúdo principal
      </a>
      <MocksNotice enabled={mocksEnabled} />
      <Sidebar route={route} user={session.manager} onLogout={session.logout} />
      <main
        ref={main}
        id="conteudo"
        tabIndex="-1"
        className="mx-auto w-full max-w-[1600px] px-5 pb-10 pt-20 sm:px-8 lg:ml-64 lg:w-[calc(100%_-_16rem)] lg:px-10 lg:py-10"
      >
        {content}
      </main>
    </div>
  );
}
