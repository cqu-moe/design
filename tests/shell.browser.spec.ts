import { test, expect } from './helpers/browser';
for (const width of [320, 390, 1440])
  test(`navigation available at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    if (width < 768) await page.getByRole('button', { name: '打开导航' }).click({ timeout: 3000 });
    await expect(
      page.getByRole('link', { name: '账号设置' }).filter({ visible: true }),
    ).toBeVisible({ timeout: 3000 });
    if (width < 768) {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: '打开导航' })).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
test('keyboard and reduced motion disable drawer movement and rapid toggles recover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: '打开导航' });
  await trigger.focus({ timeout: 3000 });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  );
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  for (let i = 0; i < 3; i++) {
    await trigger.click();
    await page.keyboard.press('Escape');
  }
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeEnabled();
});

test('lazy route initialization has an explicit loading fallback', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: '账号设置', exact: true })).toBeVisible();
  expect(warnings.filter((message) => message.includes('HydrateFallback'))).toEqual([]);
});
