import { test, expect } from '@playwright/test';
test('one global toaster follows theme and updates an existing notification', async ({ page }) => {
  await page.goto('/feedback');
  await expect(page.getByRole('heading', { name: '通知与反馈', exact: true })).toBeVisible({
    timeout: 3000,
  });
  await expect(page.locator('section[aria-label="通知"]')).toHaveCount(1);
  await page.getByRole('button', { name: '成功通知', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
  await page.getByRole('button', { name: '成功通知', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
  await page.getByRole('button', { name: '外观设置' }).click();
  await page.getByRole('menuitemradio', { name: '深色', exact: true }).click();
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark');
  await page.getByRole('button', { name: '关闭通知', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
});
test('async toast settles, undo works, and persistent feedback remains actionable', async ({
  page,
}) => {
  await page.goto('/feedback');
  await page.getByRole('button', { name: '模拟保存失败', exact: true }).click({ timeout: 3000 });
  await expect(page.locator('[data-sonner-toast]')).toContainText('正在保存');
  await expect(page.locator('[data-sonner-toast]')).toContainText('保存失败');
  await page.getByRole('button', { name: '清空通知', exact: true }).click();
  await page.getByRole('button', { name: '归档演示记录', exact: true }).click();
  await expect(page.getByText('演示记录：已归档', { exact: true })).toBeVisible();
  await page
    .locator('[data-sonner-toast]')
    .getByRole('button', { name: '撤销', exact: true })
    .click();
  await expect(page.getByText('演示记录：正常', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '模拟连接中断', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('连接已中断');
  await page.getByRole('button', { name: '重新连接', exact: true }).click();
  await expect(page.getByRole('alert')).not.toBeVisible();
});
test('reduced motion preview and mobile notification actions stay accessible', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 850 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/feedback');
  await page.getByRole('switch', { name: '减少动态效果预览' }).check({ timeout: 3000 });
  await page.getByRole('button', { name: '成功通知', exact: true }).tap();
  expect(
    await page
      .locator('[data-sonner-toast]')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  const target = await page
    .getByRole('button', { name: '关闭通知', exact: true })
    .evaluate((el) => {
      const hit = getComputedStyle(el, '::before');
      return { width: parseFloat(hit.width), height: parseFloat(hit.height) };
    });
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('modal confirmation and route changes keep one accessible notification host', async ({
  page,
}) => {
  await page.goto('/auth');
  await expect(page.locator('section[aria-label="通知"]')).toHaveCount(1);
  await page.goto('/feedback');
  await page.getByRole('switch', { name: '减少动态效果预览' }).check();
  await page.getByRole('button', { name: '预览确认弹窗' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认应用' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('[data-sonner-toast]')).toContainText('更改已应用');
  await page.getByRole('link', { name: '账号设置', exact: true }).click();
  await expect(page.locator('section[aria-label="通知"]')).toHaveCount(1);
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-preview', 'reduce');
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
});

test('keyboard-triggered notifications appear without movement', async ({ page }) => {
  await page.goto('/feedback');
  await page.getByRole('button', { name: '成功通知', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  expect(
    await page
      .locator('[data-sonner-toast]')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
});
