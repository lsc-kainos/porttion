import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestUser } from './helpers/setup-test-user';
import yahooFixtures from './fixtures/yahoo.json';
import aiFixtures from './fixtures/ai-analysis.json';

let creds: { email: string; password: string };

test.beforeAll(async () => {
  creds = await setupTestUser();
});

test.afterAll(async () => {
  await cleanupTestUser();
});

test.describe('F1b — vertical slice', () => {
  test.beforeEach(async ({ context }) => {
    // Intercepta chamadas de market do Nest (apenas em e2e — Nest fala com Yahoo direto;
    // aqui mockamos o endpoint do próprio Nest para deduplicar fixture management.)
    await context.route('**/api/v1/market/search**', async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get('q') ?? '';
      const data = (
        yahooFixtures.search as Record<string, { quotes: typeof yahooFixtures.search.PETR.quotes }>
      )[q] ?? { quotes: [] };
      const body = (data.quotes ?? []).map((it) => ({
        ticker: it.symbol.replace(/\.SA$/, ''),
        name: it.shortname,
        assetClass: 'acoes_br',
        exchange: it.exchange,
      }));
      await route.fulfill({ status: 200, body: JSON.stringify(body) });
    });
    await context.route('**/api/v1/market/quote/**', async (route) => {
      const ticker = route.request().url().split('/').pop()!;
      const sym = ticker + '.SA';
      const q = (yahooFixtures.quote as Record<string, (typeof yahooFixtures.quote)['PETR4.SA']>)[
        sym
      ];
      if (!q)
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ ticker, price: null, stale: true }),
        });
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ticker,
          price: q.regularMarketPrice,
          changePct: q.regularMarketChangePercent,
          currency: q.currency,
          lastUpdate: q.regularMarketTime,
        }),
      });
    });
    await context.route('**/api/v1/market/ohlc/**', async (route) => {
      const ticker = route.request().url().split('/').pop()!.split('?')[0];
      const sym = ticker + '.SA';
      const data =
        (yahooFixtures.ohlc as Record<string, (typeof yahooFixtures.ohlc)['PETR4.SA']>)[sym] ?? [];
      await route.fulfill({ status: 200, body: JSON.stringify(data) });
    });
    await context.route('**/api/v1/analyst/asset', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ticker?: string };
      const payload = (aiFixtures as Record<string, unknown>)[body.ticker ?? ''];
      if (!payload) return route.fulfill({ status: 422 });
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ticker: body.ticker,
          windowDays: 7,
          generatedAt: new Date().toISOString(),
          promptKey: 'asset.analysis.v1',
          promptVersion: 1,
          cached: false,
          payload,
        }),
      });
    });
  });

  test('login → create wallet → add position → dashboard → asset → analyze', async ({ page }) => {
    // 1. login
    await page.goto('/login');
    await page.getByLabel(/e.?mail/i).fill(creds.email);
    await page.getByLabel(/senha/i).fill(creds.password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. zero wallets → empty state (use unique heading; the subtitle text
    // also appears in the wallet-switcher CTA so getByText would multi-match)
    await expect(page.getByRole('heading', { name: /comece aqui/i })).toBeVisible();

    // 3. create wallet
    await page
      .getByRole('button', { name: /criar carteira/i })
      .first()
      .click();
    await page.getByLabel(/nome/i).fill('Principal');
    // Wait for the POST to finish before navigating away — sem isso, o
    // page.goto subsequente aborta a request em mobile (timing mais lento).
    const createResp = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/wallets') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /^criar$/i }).click();
    await createResp;

    // 4. navigate to carteira detail to add position
    // After wallet creation the dashboard re-renders; navigate to /carteiras to find it.
    // Target the heading inside WalletCardLarge specifically — getByText('Principal')
    // alone would also match the wallet-switcher button in the sidebar (which renders
    // the active wallet name) and clicking that opens a popover instead of navigating.
    await page.goto('/carteiras');
    await expect(page.getByRole('heading', { name: 'Principal' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('heading', { name: 'Principal' }).click();
    await expect(page).toHaveURL(/\/carteiras\/.+/);

    const addBtn = page.getByRole('button', { name: /adicionar posi/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.getByPlaceholder(/buscar/i).fill('PETR');
    await page.getByText('PETR4').first().click();
    await page.getByLabel(/quantidade/i).fill('100');
    await page.getByLabel(/preço/i).fill('30');
    const addPositionResp = page.waitForResponse(
      (r) => r.url().includes('/positions') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /^adicionar$/i }).click();
    await addPositionResp;

    // 5. dashboard mostra KPIs
    // "Patrimônio" também aparece em "Evolução do patrimônio" (placeholder) —
    // usamos exact:true pra casar só o label do KPI card. Não checamos o valor
    // exato em R$ porque o backend chama Yahoo direto (não há fixture na API);
    // basta confirmar que o KPI renderizou.
    await page.goto('/dashboard');
    await expect(page.getByText('Patrimônio', { exact: true })).toBeVisible({ timeout: 15_000 });

    // 6. asset detail — click on position PETR4
    // O ticker aparece em vários lugares (badge, tabela/card); pegar o link da row.
    await page.getByRole('link', { name: /PETR4/i }).first().click();
    await expect(page).toHaveURL(/\/ativos\/PETR4/);
    await expect(page.getByRole('img', { name: /candles/i })).toBeVisible();

    // 7. analyze
    await page.getByRole('button', { name: /analisar/i }).click();
    await expect(page.getByText(/manter/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Suporte testado/)).toBeVisible();
    await expect(page.getByText(/análise técnica gerada por ia/i)).toBeVisible();

    // 8. volta dashboard via sidebar
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
