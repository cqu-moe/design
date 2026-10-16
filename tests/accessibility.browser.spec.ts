import { elementContrast } from './helpers/contrast';
import { test, expect } from './helpers/browser';
test('destructive button has readable composited colors in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme', 'dark'));
  await page.goto('/components');
  const button = page.getByRole('button', { name: '危险操作', exact: true });
  const ratio = await button.evaluate(elementContrast);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
test('touch theme menu options each provide 44px height', async ({ newContext }) => {
  const context = await newContext({
    viewport: { width: 320, height: 700 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/settings');
  await page.getByRole('button', { name: '外观设置' }).tap();
  for (const name of ['浅色', '深色', '跟随系统']) {
    await expect
      .poll(
        async () =>
          (await page.getByRole('menuitemradio', { name, exact: true }).boundingBox())!.height,
      )
      .toBeGreaterThanOrEqual(44);
  }
});

for (const theme of ['light', 'dark']) {
  test(`${theme} brand actions and selected navigation keep readable contrast`, async ({
    page,
  }) => {
    await page.addInitScript((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.goto('/components');
    for (const name of ['主要操作', '次要操作']) {
      const button = page.getByRole('button', { name, exact: true });
      expect(await button.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
      await button.hover();
      await expect.poll(() => button.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
    }
    const current = page.locator('.ds-sidebar a[aria-current="page"]');
    expect(await current.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
  });
}

test('press feedback moves only for pointer input without reduced motion', async ({ page }) => {
  await page.goto('/components');
  const button = page.getByRole('button', { name: '主要操作', exact: true });
  await button.focus();
  await page.keyboard.down('Space');
  expect(await button.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await page.keyboard.up('Space');
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).transform)).not.toBe('none');
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.down();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await page.mouse.up();
});
