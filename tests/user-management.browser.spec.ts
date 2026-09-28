import { test, expect } from '@playwright/test';
test('page size and cross-page selection support confirmed bulk changes', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('checkbox', { name: '选择本页全部用户' }).check({ timeout: 3000 });
  await expect(page.getByText('已选择 5 位用户', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await page.getByRole('checkbox', { name: '选择赵同学' }).check();
  await expect(page.getByText('已选择 6 位用户', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: '批量操作' }).click();
  await page.getByRole('option', { name: '停用账号', exact: true }).click();
  await page.getByRole('button', { name: '应用更改', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('6 位用户');
  await page.getByRole('button', { name: '确认应用', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('6 位用户');
  await page.getByRole('combobox', { name: '每页条数' }).click();
  await page.getByRole('option', { name: '10 条 / 页', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('checkbox', { name: '选择本页全部用户' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: '下一页', exact: true })).toBeDisabled();
  const rows = page.locator('tbody tr');
  for (let i = 0; i < 6; i++) await expect(rows.nth(i)).toContainText('停用');
});
test('advanced filters apply together, validate dates, reset and clear selection', async ({
  page,
}) => {
  await page.goto('/admin/users');
  await page.getByRole('checkbox', { name: '选择林同学' }).check({ timeout: 3000 });
  await page.getByRole('button', { name: '高级筛选', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('加入日期起始').fill('2026-09-20');
  await sheet.getByLabel('加入日期结束').fill('2026-09-01');
  await sheet.getByRole('button', { name: '应用筛选', exact: true }).click();
  await expect(sheet.getByRole('alert')).toContainText('起始日期');
  await sheet.getByLabel('加入日期起始').fill('2026-09-01');
  await sheet.getByLabel('加入日期结束').fill('2026-09-10');
  await sheet.getByRole('combobox', { name: '角色', exact: true }).click();
  await page.getByRole('option', { name: '成员', exact: true }).click();
  await sheet.getByLabel('邮箱域名', { exact: true }).fill('example.test');
  await sheet.getByRole('button', { name: '应用筛选', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody')).toContainText('陈同学');
  await expect(page.locator('tbody')).toContainText('王同学');
  await expect(page.getByText(/已选择 \d+ 位用户/)).not.toBeVisible();
  await page.getByRole('button', { name: '重置全部筛选', exact: true }).click();
  await expect(page.getByText('共 6 位用户', { exact: true })).toBeVisible();
});

test('editing a filtered-out row returns focus to search', async ({ page }) => {
  await page.goto('/admin/users');
  const search = page.getByRole('searchbox', { name: '搜索用户' });
  await search.fill('林同学');
  await page.getByRole('button', { name: '编辑林同学' }).click();
  await page.getByRole('dialog').getByLabel('显示名称', { exact: true }).fill('已改名');
  await page.getByRole('button', { name: '保存用户' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(search).toBeFocused();
});
test('bulk operation that empties the filter returns focus to search', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('combobox', { name: '筛选用户状态' }).click();
  await page.getByRole('option', { name: '正常', exact: true }).click();
  await page.getByRole('checkbox', { name: '选择本页全部用户' }).check();
  await page.getByRole('combobox', { name: '批量操作' }).click();
  await page.getByRole('option', { name: '停用账号', exact: true }).click();
  await page.getByRole('button', { name: '应用更改', exact: true }).click();
  await page.getByRole('button', { name: '确认应用', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('checkbox', { name: '选择本页全部用户' })).toBeDisabled();
  await expect(page.getByRole('searchbox', { name: '搜索用户' })).toBeFocused();
});

test('desktop bulk toolbar remains a compact single row', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto('/admin/users');
  await page.getByRole('checkbox', { name: '选择本页全部用户' }).check();
  expect((await page.locator('.bulk-toolbar').boundingBox())!.height).toBeLessThanOrEqual(52);
});
