import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
for (const width of [390, 768, 1440])
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/settings');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    await page.getByLabel('显示名称', { exact: true }).fill('示例新名称');
    await page.getByRole('button', { name: '保存显示名称', exact: true }).click();
    await page.locator('[data-action-state=success]').waitFor();
    await page.screenshot({
      path: `docs/screenshots/v1-settings-${width}-${theme}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.goto('http://127.0.0.1:5173/auth');
    await page.getByText('演示选项', { exact: true }).click();
    await page.getByRole('button', { name: '填入演示信息' }).click();
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.locator('[data-action-state=success]').waitFor();
    await page.screenshot({
      path: `docs/screenshots/v1-auth-${width}-${theme}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.goto('http://127.0.0.1:5173/items');
    await page.getByText('演示状态', { exact: true }).click();
    await page.getByLabel('列表状态').selectOption('forbidden');
    await page.screenshot({
      path: `docs/screenshots/v1-forbidden-${width}-${theme}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
await browser.close();
console.log('v1 state screenshots captured.');
