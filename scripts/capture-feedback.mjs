import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
for (const width of [390, 1440])
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/feedback');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    await page.getByRole('heading', { name: '通知与反馈', exact: true }).waitFor();
    await page.screenshot({
      path: `docs/screenshots/feedback-${width}-${theme}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: '成功通知', exact: true }).click();
    await page.locator('[data-sonner-toast][data-mounted=true]').waitFor();
    await page.screenshot({
      path: `docs/screenshots/feedback-toast-${width}-${theme}.png`,
      animations: 'disabled',
    });
  }
await browser.close();
console.log('Feedback screenshots captured.');
