import { test, expect } from '@playwright/test';
test('login and registration share email but clear passwords on mode switch', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: '欢迎回来', exact: true })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByText('请输入有效的邮箱地址。', { exact: true })).toBeVisible();
  await page.getByLabel('邮箱', { exact: true }).fill('demo@example.test');
  await page.getByLabel('密码', { exact: true }).fill('Demo12345!');
  await page.getByRole('button', { name: '显示密码', exact: true }).click();
  await expect(page.getByLabel('密码', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('tab', { name: '注册', exact: true }).click();
  await expect(page.getByRole('heading', { name: '创建账号', exact: true })).toBeVisible();
  await expect(page.getByLabel('邮箱', { exact: true })).toHaveValue('demo@example.test');
  await expect(page.getByLabel('密码', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('密码', { exact: true })).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
});
test('registration validates password length and demonstrates failure then success without requests', async ({
  page,
}) => {
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.url());
  });
  await page.goto('/auth?mode=register');
  await page.getByLabel('显示名称', { exact: true }).fill('演示用户', { timeout: 3000 });
  await page.getByLabel('邮箱', { exact: true }).fill('demo@example.test');
  await page.getByLabel('密码', { exact: true }).fill('short');
  await page.getByRole('button', { name: '创建账号', exact: true }).click();
  await expect(page.getByText('密码至少需要 8 个字符。', { exact: true })).toBeVisible();
  await page.getByLabel('密码', { exact: true }).fill('Demo12345!');
  await page.getByText('演示选项', { exact: true }).click();
  await page.getByLabel('模拟提交失败').check();
  await page.getByRole('button', { name: '创建账号', exact: true }).click();
  await expect(page.getByRole('button', { name: '正在创建…', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('提交失败');
  await page.getByLabel('模拟提交失败').uncheck();
  await page.getByRole('button', { name: '创建账号', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('注册演示完成');
  expect(posts).toEqual([]);
});
test('auth forms fit mobile and desktop in both themes', async ({ page }) => {
  for (const width of [390, 1440])
    for (const mode of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto('/auth');
      await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), mode);
      await page.reload();
      for (const tab of ['登录', '注册']) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await expect(page.getByLabel('邮箱', { exact: true })).toBeVisible();
      }
    }
});
