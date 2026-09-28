import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
for (const width of [390, 1440])
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/auth');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    for (const mode of ['login', 'register']) {
      await page.goto(`http://127.0.0.1:5173/auth?mode=${mode}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.screenshot({
        path: `docs/screenshots/auth-${mode}-${width}-${theme}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
await browser.close();
console.log('Auth screenshots captured.');
