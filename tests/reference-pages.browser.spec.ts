import { test, expect } from '@playwright/test';
test('settings validates, prevents duplicate submission and recovers after failure', async ({
  page,
}) => {
  await page.goto('/settings');
  const name = page.getByLabel('显示名称', { exact: true });
  await name.fill('', { timeout: 3000 });
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(page.getByText('请输入显示名称。', { exact: true })).toBeVisible();
  await name.fill('新的显示名称');
  await expect(page.getByText('请输入显示名称。', { exact: true })).not.toBeVisible();
  await page.getByText('演示状态', { exact: true }).click();
  await page.getByLabel('模拟保存失败').check();
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(page.getByRole('button', { name: '正在保存…' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('保存失败');
  await expect(name).toHaveValue('新的显示名称');
  await page.getByLabel('模拟保存失败').uncheck();
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('已保存');
});
test('list empty state recovers and unknown detail is navigable', async ({ page }) => {
  await page.goto('/items');
  await page.getByRole('searchbox', { name: '搜索服务' }).fill('不存在的服务', { timeout: 3000 });
  await expect(page.getByText('没有找到匹配的服务', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '清除筛选' }).click();
  await page.getByRole('link', { name: '课表订阅', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('课表订阅');
  await page.goto('/items/missing');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('未找到服务');
  await page.getByRole('link', { name: '返回服务列表' }).click();
  await expect(page).toHaveURL(/\/items$/);
});
for (const width of [320, 390, 768, 1440])
  for (const mode of ['light', 'dark'] as const)
    test(`reference pages fit ${width} ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('cqu-moe-theme', value), mode);
      for (const route of ['/settings', '/items', '/items/schedule', '/components']) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    });
test('touch controls stay reachable and long content survives zoom', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/settings');
  const menu = page.getByRole('button', { name: '打开导航' });
  const box = await menu.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(
    await page
      .getByLabel('显示名称', { exact: true })
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await menu.tap();
  await page.getByRole('link', { name: '服务管理' }).filter({ visible: true }).tap();
  await expect(page.getByRole('heading', { name: '服务管理', exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:5173/items/archive');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('课程资料归档');
  await page.evaluate(() => (document.documentElement.style.zoom = '2'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
