import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
for (const width of [390, 1440])
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/feedback');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    const panel = page
      .locator('.component-section')
      .filter({ has: page.getByRole('heading', { name: '按钮状态反馈', exact: true }) });
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByRole('button', { name: '设置已保存', exact: true }).waitFor();
    await panel.screenshot({
      path: `docs/screenshots/action-success-${width}-${theme}.png`,
      animations: 'disabled',
    });
    await page.getByRole('switch', { name: '模拟按钮失败' }).check();
    await page.getByRole('button', { name: '设置已保存', exact: true }).click();
    await page.getByRole('button', { name: '重试保存', exact: true }).waitFor();
    await panel.screenshot({
      path: `docs/screenshots/action-error-${width}-${theme}.png`,
      animations: 'disabled',
    });
  }
await browser.close();
console.log('Action button result screenshots captured.');
