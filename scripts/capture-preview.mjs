import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const contrast = [];
for (const width of [390, 768, 1440])
  for (const mode of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:5173/settings');
    await page.evaluate((m) => localStorage.setItem('cqu-moe-theme', m), mode);
    await page.reload();
    await page.getByRole('heading', { name: '账号设置', exact: true }).waitFor();
    await page.screenshot({
      path: `docs/screenshots/settings-${width}-${mode}.png`,
      fullPage: true,
    });
    if (width === 1440) {
      contrast.push(
        await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          const rgb = (value) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
          };
          const luminance = (color) =>
            rgb(color)
              .map((v) => {
                v /= 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              })
              .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
          const style = getComputedStyle(document.documentElement);
          const pairs = [
            'foreground',
            'muted-foreground',
            'success',
            'warning',
            'link',
            'destructive',
          ].flatMap((fg) =>
            ['background', 'surface'].map((bg) => {
              const a = luminance(style.getPropertyValue('--' + fg)),
                b = luminance(style.getPropertyValue('--' + bg));
              return {
                fg,
                bg,
                ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2),
              };
            }),
          );
          return { theme: document.documentElement.dataset.theme, pairs };
        }),
      );
    }
  }
await page.setViewportSize({ width: 1440, height: 1000 });
for (const route of ['items', 'components']) {
  await page.goto(`http://127.0.0.1:5173/${route}`);
  await page.screenshot({ path: `docs/screenshots/${route}-1440-dark.png`, fullPage: true });
}
await writeFile('docs/contrast.json', JSON.stringify(contrast, null, 2) + '\n');
console.log(JSON.stringify(contrast));
await browser.close();
