import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('login sem violações WCAG 2.2 A/AA detectadas', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByLabel('E-mail')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();

  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  ).toEqual([]);
});
