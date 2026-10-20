import { test, expect } from './helpers/browser';
import { elementBackground, elementContrast } from './helpers/contrast';
test('honors stored theme before application renders', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme', 'dark'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(
    await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe('rgb(0, 0, 0)');
});
test('invalid preference follows system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme', 'corrupt'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('storage denied still renders', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} brand actions are blue while work actions stay neutral`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.goto('/brand');
    const marketing = page.getByRole('link', { name: '查看使用规范', exact: true });
    const work = page.getByRole('link', { name: '查看工作界面', exact: true });
    for (const action of [marketing, work])
      expect((await action.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    for (const fallback of [false, true]) {
      // Also exercise the CSS-only system preference before theme initialization.
      if (fallback)
        await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
      const [r, g, b] = await marketing.evaluate(elementBackground);
      expect(b).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(g);
      expect(await marketing.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
      const neutral = await work.evaluate(elementBackground);
      expect(Math.max(...neutral) - Math.min(...neutral)).toBeLessThanOrEqual(1);
      expect(await work.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
      expect(
        await page.evaluate(() => {
          const css = getComputedStyle(document.documentElement);
          const ink = css.getPropertyValue('--brand-ink').trim();
          return (
            ink !== '' &&
            ['--link', '--ring'].every((name) => css.getPropertyValue(name).trim() === ink)
          );
        }),
      ).toBe(true);
    }
    await marketing.hover();
    await expect.poll(() => marketing.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
  });
}
