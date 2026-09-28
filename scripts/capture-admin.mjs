import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const width of [390, 1440])
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/settings');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    for (const [name, route] of [
      ['settings-profile', '/settings'],
      ['settings-appearance', '/settings?section=appearance'],
      ['dashboard', '/admin'],
      ['analytics', '/admin/analytics'],
      ['users', '/admin/users'],
      ['clients', '/admin/clients'],
      ['services', '/items'],
    ]) {
      await page.goto('http://127.0.0.1:5173' + route);
      await page.getByRole('heading', { level: 1 }).waitFor();
      if (route === '/admin' || route === '/admin/analytics')
        await page.locator('.recharts-surface').first().waitFor();
      await page.screenshot({
        path: `docs/screenshots/${name}-${width}-${theme}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:5173/admin/users');
await page.evaluate(() => localStorage.setItem('cqu-moe-theme', 'light'));
await page.reload();
await page.getByRole('checkbox', { name: '选择本页全部用户' }).check();
await page.getByRole('combobox', { name: '批量操作' }).click();
await page.getByRole('option', { name: '停用账号', exact: true }).click();
await page.screenshot({
  path: 'docs/screenshots/users-bulk-1440-light.png',
  fullPage: true,
  animations: 'disabled',
});
await page.getByRole('button', { name: '应用更改', exact: true }).click();
await page.screenshot({
  path: 'docs/screenshots/users-bulk-confirm-1440-light.png',
  fullPage: true,
  animations: 'disabled',
});
await page.getByRole('button', { name: '取消', exact: true }).click();
await page.getByRole('button', { name: '高级筛选', exact: true }).click();
await page.screenshot({
  path: 'docs/screenshots/users-filters-1440-light.png',
  fullPage: true,
  animations: 'disabled',
});
await page.keyboard.press('Escape');
await page.setViewportSize({ width: 390, height: 850 });
await page.evaluate(() => localStorage.setItem('cqu-moe-theme', 'dark'));
await page.reload();
await page.getByRole('button', { name: '高级筛选', exact: true }).click();
await page.screenshot({
  path: 'docs/screenshots/users-filters-390-dark.png',
  fullPage: true,
  animations: 'disabled',
});
await browser.close();
console.log('Captured 32 updated page and filter screenshots.');
