import { expect, test } from '@playwright/test';

const users = [
  { id: '1', username: 'ana', full_name: 'Ana Silva', department: 'Produto' },
  { id: '2', username: 'bia', full_name: 'Bia Lima', department: 'TI' },
];
const realtime = [
  { username: 'ana', status: 'offline', seconds_since_last_activity: 901, process_name: 'Editor' },
];
const managerToken = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyIn0.${'A'.repeat(43)}`;
const manager = {
  id: 'b06e3df5-c23b-49ec-9a40-081a451620b3',
  email: 'gestor@empresa.com',
  created_at: '2026-10-21T12:00:00Z',
};

async function mockApi(page) {
  await page.route('http://localhost:8000/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/me') return route.fulfill({ json: manager });
    if (url.pathname === '/auth/login') {
      return route.fulfill({
        json: { access_token: managerToken, token_type: 'bearer', expires_in: 3600 },
      });
    }
    if (url.pathname === '/auth/register') return route.fulfill({ status: 201, json: manager });
    if (url.pathname === '/users/') return route.fulfill({ json: users });
    if (url.pathname === '/activities/realtime') return route.fulfill({ json: realtime });
    if (url.pathname === '/dashboard/summary') {
      return route.fulfill({
        json: {
          date: url.searchParams.get('date'),
          users: users
            .filter(
              (user) =>
                !url.searchParams.get('username') ||
                url.searchParams.get('username') === user.username,
            )
            .map((user) => ({
              username: user.username,
              total_seconds: 3600,
              by_category: [{ category: 'Trabalho', total_seconds: 3600 }],
            })),
        },
      });
    }
    if (url.pathname === '/config/') {
      return route.fulfill({
        json:
          route.request().method() === 'PUT'
            ? JSON.parse(route.request().postData())
            : { capture_interval_seconds: 10, idle_timeout_seconds: 300 },
      });
    }
    if (url.pathname === '/dashboard/export/csv') {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'username,category,total_seconds\nana,Trabalho,3600\n',
      });
    }
    if (url.pathname === '/dashboard/export/pdf') {
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n' });
    }
    return route.fulfill({ status: 404, json: { detail: 'Rota não encontrada' } });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, token }) => {
      if (location.hash !== '#/cadastro') sessionStorage.setItem(key, token);
    },
    { key: 'timetracker.manager.access-token', token: managerToken },
  );
  await mockApi(page);
});

test('restaura a sessão do gestor, filtra data e usuário e navega até a rota 404', async ({
  page,
}) => {
  await page.goto('/#/painel');
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta' })).toHaveCount(0);
  await expect(page.getByRole('table').first()).toContainText('Ana Silva');
  await expect(page.getByRole('table').first()).toContainText('15min atrás');
  await expect(page.getByRole('table').first()).toContainText('Sem dados');
  await page.getByLabel('Data do resumo').fill('2026-09-24');
  await page.getByRole('combobox', { name: 'Usuário' }).selectOption('ana');
  await expect(page.getByLabel('Indicadores disponíveis')).toContainText('1h 00min');
  await page
    .getByRole('navigation', { name: 'Menu principal' })
    .getByRole('link', { name: 'Colaboradores' })
    .click();
  await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await page.goto('/#/inexistente');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
});

test('integra login e confirma que cadastro não cria uma sessão automaticamente', async ({
  page,
}) => {
  await page.goto('/#/cadastro');
  await page.getByLabel('E-mail').fill('gestor@empresa.com');
  await page.getByLabel('Senha').fill('SenhaSegura123!');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('status')).toContainText(/não inicia uma sessão automaticamente/i);
  await expect(page.getByRole('link', { name: 'Ir para entrar', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Ir para entrar', exact: true }).click();
  await page.getByLabel('E-mail').fill('gestor@empresa.com');
  await page.getByLabel('Senha').fill('SenhaSegura123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem('timetracker.manager.access-token')),
  ).toBe(managerToken);
});

test('filtra aplicativos somente na última atividade e combina com usuário', async ({ page }) => {
  await page.route('http://localhost:8000/activities/realtime', (route) =>
    route.fulfill({
      json: [
        {
          username: 'ana',
          status: 'online',
          seconds_since_last_activity: 5,
          process_name: 'Editor',
        },
        {
          username: 'bia',
          status: 'online',
          seconds_since_last_activity: 8,
          process_name: 'Chrome',
        },
      ],
    }),
  );
  await page.goto('/#/painel');

  const activity = page.getByLabel('Tabela de última atividade com rolagem horizontal');
  const metrics = page.getByLabel('Indicadores disponíveis');
  await expect(activity).toContainText('Ana Silva');
  await expect(activity).toContainText('Bia Lima');
  await expect(metrics).toContainText('2h 00min');

  await page.getByLabel('Aplicativo na última atividade').selectOption('Chrome');
  await expect(activity).toContainText('Bia Lima');
  await expect(activity).not.toContainText('Ana Silva');
  await expect(metrics).toContainText('2h 00min');

  await page.getByRole('combobox', { name: 'Usuário' }).selectOption('ana');
  await expect(page.getByText('Nenhum usuário corresponde aos filtros aplicados.')).toBeVisible();
  await expect(page.getByText(/Filtro ativo: Chrome; 0 de 1 usuários nesta lista/)).toBeVisible();
  await page.getByRole('button', { name: 'Limpar aplicativo' }).click();
  await expect(activity).toContainText('Ana Silva');
});

test('filtra e atualiza a lista de atividade dos colaboradores', async ({ page }) => {
  await page.route('http://localhost:8000/activities/realtime', (route) =>
    route.fulfill({
      json: [
        {
          username: 'ana',
          status: 'online',
          seconds_since_last_activity: 20,
          process_name: 'Editor',
          hostname: 'ESTACAO-01',
        },
        {
          username: 'bia',
          status: 'offline',
          seconds_since_last_activity: 901,
          process_name: 'Chrome',
          hostname: 'ESTACAO-02',
        },
      ],
    }),
  );
  let userRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/users/') userRequests += 1;
  });
  await page.goto('/#/colaboradores');

  const table = page.getByRole('table', { name: 'Usuários cadastrados na API' });
  await expect(table).toContainText('20s atrás');
  await expect(table).toContainText('15min atrás');
  await expect(table).not.toContainText('ESTACAO-01');
  await expect(page.getByText(/2 de 2 colaboradores/)).toBeVisible();

  await page.getByRole('searchbox', { name: 'Pesquisar colaborador' }).fill('Bia Lima');
  await page.getByLabel('Estado informado pela API').selectOption('offline');
  await page.getByLabel('Aplicativo na última leitura').selectOption('Chrome');
  await expect(table).toContainText('Bia Lima');
  await expect(table).not.toContainText('Ana Silva');
  await expect(page.getByText(/1 de 2 colaboradores/)).toBeVisible();

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(table).toContainText('Ana Silva');
  await expect(table).toContainText('Bia Lima');

  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect.poll(() => userRequests).toBe(2);
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeEnabled();
});

test('mostra falha da API e recupera a lista ao tentar novamente', async ({ page }) => {
  let attempts = 0;
  await page.route('http://localhost:8000/users/', async (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, json: { detail: 'Serviço temporariamente indisponível' } })
      : route.fulfill({ json: users });
  });
  await page.goto('/#/colaboradores');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('table')).toContainText('Ana Silva');
});

test('mostra falha de conexão com API offline e recupera após retry', async ({ page }) => {
  let offline = true;
  await page.route('http://localhost:8000/users/', (route) =>
    offline ? route.abort('failed') : route.fulfill({ json: users }),
  );
  await page.goto('/#/colaboradores');
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API');
  offline = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('table')).toContainText('Ana Silva');
});

test('lê e salva configurações com GET e PUT', async ({ page }) => {
  const put = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/config/'),
  );
  await page.goto('/#/configuracoes');
  await expect(page.getByLabel('Intervalo de captura (segundos)')).toHaveValue('10');
  await page.getByLabel('Limite de inatividade (segundos)').fill('240');
  await page.getByRole('button', { name: 'Salvar configurações' }).click();
  const request = await put;
  expect(request.postDataJSON()).toEqual({
    capture_interval_seconds: 10,
    idle_timeout_seconds: 240,
  });
  await expect(page.getByText('Configurações salvas.')).toBeVisible();
});

test('confirma saída de configurações com alterações pendentes', async ({ page }) => {
  await page.goto('/#/configuracoes');
  await page.getByLabel('Limite de inatividade (segundos)').fill('240');
  const panel = page
    .getByRole('navigation', { name: 'Menu principal' })
    .getByRole('link', { name: 'Painel' });
  const dismiss = page.waitForEvent('dialog').then((dialog) => dialog.dismiss());
  await Promise.all([dismiss, panel.click()]);
  await expect(page).toHaveURL(/#\/configuracoes$/);
  await expect(page.getByText('Alterações não salvas')).toBeVisible();
  const accept = page.waitForEvent('dialog').then((dialog) => dialog.accept());
  await Promise.all([accept, panel.click()]);
  await expect(page).toHaveURL(/#\/painel$/);
});

test('baixa CSV e PDF no navegador', async ({ page }) => {
  await page.goto('/#/relatorios');
  for (const format of ['CSV', 'PDF']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: `Exportar ${format}` }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^resumo_\\d{4}-\\d{2}-\\d{2}\\.${format.toLowerCase()}$`),
    );
    expect(await download.failure()).toBeNull();
    await expect(page.getByRole('status')).toContainText(`Download de ${format} iniciado.`);
  }
});

for (const width of [375, 768, 1366]) {
  test(`alternância entre cards e tabelas em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#/painel');
    const activityCards = page.locator(
      'div[aria-label="Última atividade dos usuários cadastrados"]',
    );
    const activityTable = page.getByLabel('Tabela de última atividade com rolagem horizontal');
    if (width < 640) {
      await expect(activityCards).toContainText('Ana Silva');
      await expect(activityTable).toBeHidden();
      await page.getByLabel('Data do resumo').fill('2026-09-24');
      await expect(page.getByText('Filtro ativo')).toBeVisible();
    } else {
      await expect(activityTable).toContainText('Ana Silva');
      await expect(activityCards).toBeHidden();
    }
    await page.goto('/#/colaboradores');
    const collaboratorCards = page.locator('div[aria-label="Usuários cadastrados na API"]');
    const collaboratorTable = page.getByLabel('Tabela de colaboradores com rolagem horizontal');
    if (width < 640) {
      await expect(collaboratorCards).toContainText('Ana Silva');
      await expect(collaboratorTable).toBeHidden();
    } else {
      await expect(collaboratorTable).toContainText('Ana Silva');
      await expect(collaboratorCards).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('menu móvel oculta cadastro e mantém o último link acessível em orientação horizontal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 320 });
  await page.goto('/#/painel');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Criar conta' })).toHaveCount(0);
  const lastLink = dialog.getByRole('link', { name: 'Configurações' });
  await lastLink.scrollIntoViewIfNeeded();
  await expect(lastLink).toBeInViewport();
  await lastLink.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Configurações');
  await expect(page.getByRole('main')).toBeFocused();
});

test('navega para a prévia desativada de Tasks sem habilitar gravação fictícia', async ({
  page,
}) => {
  await page.goto('/#/painel');
  await page
    .getByRole('navigation', { name: 'Menu principal' })
    .getByRole('link', { name: 'Tasks' })
    .click();
  await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();
  await expect(page.getByText('Gestão de Tasks indisponível')).toBeVisible();
  await expect(
    page.getByText(/prévia desativada; nenhuma chamada ou gravação será feita/i),
  ).toBeVisible();
  await expect(page.getByLabel('Título')).toBeDisabled();
  await expect(page.getByLabel('Descrição')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Criar Task' })).toBeDisabled();
});

test('menu móvel aceita teclado e tema escuro', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/#/painel');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu principal mobile' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Menu principal mobile' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Tema escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const [width, height] of [
  [375, 667],
  [390, 844],
  [768, 1024],
  [1366, 768],
  [1920, 1080],
]) {
  test(`sem rolagem horizontal na página em ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#/painel');
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

for (const route of ['colaboradores', 'relatorios', 'configuracoes']) {
  test(`${route} cabe em 390px sem rolagem da página`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/#/${route}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });
}

test('conteúdo permanece utilizável com ampliação CSS de 200%', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#/painel');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await expect(page.getByLabel('Tabela de última atividade com rolagem horizontal')).toBeVisible();
});
