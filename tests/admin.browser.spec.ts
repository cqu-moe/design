import { test, expect } from './helpers/browser';
test('dashboard and charts expose data and respond to period changes', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: '仪表盘', exact: true })).toBeVisible({
    timeout: 3000,
  });
  await expect(page.getByText('全部为演示数据', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '近 30 天', exact: true }).click();
  await expect(page.getByRole('button', { name: '近 30 天', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/admin/analytics');
  await expect(page.getByRole('heading', { name: '数据分析', exact: true })).toBeVisible();
  await page.getByText('查看请求量趋势数据', { exact: true }).click();
  await expect(page.getByRole('table', { name: '请求量趋势数据' })).toBeVisible();
});
test('user management search, edit and client details work locally', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('searchbox', { name: '搜索用户' }).fill('林同学', { timeout: 3000 });
  await expect(page.getByRole('row').filter({ hasText: '林同学' })).toHaveCount(1);
  await page.getByRole('button', { name: '编辑林同学' }).click();
  await page.getByRole('dialog').getByLabel('显示名称', { exact: true }).fill('林同学改名');
  await page.getByRole('button', { name: '保存用户' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: '林同学改名' })).toHaveCount(1);
  await page.goto('/admin/clients');
  await page.getByRole('button', { name: '查看课表 Web 详情' }).click();
  await expect(page.getByRole('dialog')).toContainText('schedule-web');
  await expect(page.getByRole('dialog')).toContainText('https://schedule.example.test/callback');
});
for (const width of [320, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`admin views fit ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((v) => localStorage.setItem('cqu-moe-theme', v), theme);
      for (const path of ['/admin', '/admin/analytics', '/admin/users', '/admin/clients']) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    });

test('demo changes are reflected across admin modules', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('button', { name: '新增用户', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('显示名称', { exact: true }).fill('新增示例');
  await dialog.getByLabel('邮箱', { exact: true }).fill('new@example.test');
  await page.getByRole('button', { name: '保存用户' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: '仪表盘', exact: true }).click();
  await expect(
    page.locator('.metric-card').filter({ hasText: '用户总数' }).locator('strong'),
  ).toHaveText('7');
  await page.getByRole('link', { name: '客户端管理', exact: true }).click();
  await page.getByRole('button', { name: '查看课表 Web 详情' }).click();
  await page.getByRole('button', { name: '暂停演示客户端' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '仪表盘', exact: true }).click();
  await expect(
    page.locator('.metric-card').filter({ hasText: '启用客户端' }).locator('strong'),
  ).toHaveText('2');
});
