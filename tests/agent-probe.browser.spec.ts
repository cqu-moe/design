import { test, expect } from '@playwright/test';
test('fresh Agent page uses shared inputs and honest local feedback', async ({ page }) => {
  await page.goto('/agent-probe');
  await page.getByRole('button', { name: '保存偏好' }).click();
  await expect(
    page.getByText('请输入有效的邮箱地址，例如 name@example.com。', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('通知邮箱').fill('demo@example.com');
  await page.getByRole('switch', { name: '接收邮件通知' }).click();
  await page.getByRole('button', { name: '保存偏好' }).click();
  await expect(page.getByRole('status')).toContainText('未同步到服务器');
  await expect(page.getByRole('button', { name: '保存偏好' })).toBeDisabled();
});
