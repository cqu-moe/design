import { test, expect } from '@playwright/test';
test('settings tabs retain drafts, URL state and directional motion', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('显示名称', { exact: true }).fill('未保存的名字');
  await page.getByRole('tab', { name: '外观', exact: true }).click({ timeout: 3000 });
  await expect(page).toHaveURL(/section=appearance/);
  await expect(page.getByRole('tabpanel', { name: '外观', exact: true })).toBeVisible();
  await expect(page.getByLabel('显示名称', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('tabpanel', { name: '外观', exact: true })).toHaveAttribute(
    'data-direction',
    'forward',
  );
  await page.getByRole('tab', { name: '个人资料', exact: true }).click();
  await expect(page.getByLabel('显示名称', { exact: true })).toHaveValue('未保存的名字');
  await expect(page.getByRole('tabpanel', { name: '个人资料', exact: true })).toHaveAttribute(
    'data-direction',
    'backward',
  );
  await page.getByRole('tab', { name: '个人资料', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '外观', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(
    await page.getByRole('tabpanel').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
});
test('inline saves isolate fields and global save covers remaining drafts across tabs', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByLabel('显示名称', { exact: true }).fill('新的名字');
  await page.getByLabel('联系邮箱', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: '保存显示名称', exact: true }).click({ timeout: 3000 });
  await expect(page.getByRole('status')).toContainText('显示名称已保存');
  await expect(page.getByText('请输入有效的邮箱地址。', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '保存显示名称', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '保存联系邮箱', exact: true })).toBeEnabled();
  await page.getByLabel('联系邮箱', { exact: true }).fill('new@example.com');
  await page.getByRole('tab', { name: '通知', exact: true }).click();
  await page.getByRole('switch', { name: '服务更新通知' }).click();
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('已保存全部更改');
  await expect(page.getByRole('button', { name: '保存更改', exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: '个人资料', exact: true }).click();
  await expect(page.getByRole('button', { name: '保存联系邮箱', exact: true })).toBeDisabled();
});
test('desktop service list uses compact width and rows', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/items');
  const table = page.getByRole('table');
  expect((await table.boundingBox())!.width).toBeLessThanOrEqual(944);
  const row = page.getByRole('row').nth(1);
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(72);
});
