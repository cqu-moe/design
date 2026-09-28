import { elementContrast } from './helpers/contrast';
import { test, expect } from '@playwright/test';
test('destructive button has readable composited colors in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme', 'dark'));
  await page.goto('/components');
  const button = page.getByRole('button', { name: '危险操作', exact: true });
  const ratio = await button.evaluate(elementContrast);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
test('touch theme menu options each provide 44px height', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 700 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/settings');
  await page.getByRole('button', { name: '外观设置' }).tap();
  for (const name of ['浅色', '深色', '跟随系统']) {
    await expect
      .poll(
        async () =>
          (await page.getByRole('menuitemradio', { name, exact: true }).boundingBox())!.height,
      )
      .toBeGreaterThanOrEqual(44);
  }
  await context.close();
});
