import { test, expect } from '@playwright/test';
test('destructive button has readable composited colors in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme', 'dark'));
  await page.goto('/components');
  const button = page.getByRole('button', { name: '危险操作', exact: true });
  const ratio = await button.evaluate((el) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    const parse = (value: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const ancestors: Element[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) ancestors.unshift(node);
    let background = [255, 255, 255];
    for (const node of ancestors) {
      const [r, g, b, a] = parse(getComputedStyle(node).backgroundColor);
      background = [r, g, b].map((v, i) => (v * a) / 255 + background[i] * (1 - a / 255));
    }
    const foreground = parse(getComputedStyle(el).color).slice(0, 3);
    const luminance = (rgb: number[]) =>
      rgb
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const a = luminance(background),
      b = luminance(foreground);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
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
