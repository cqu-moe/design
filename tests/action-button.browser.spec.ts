import { elementContrast, elementBackground } from './helpers/contrast';
import { test, expect } from './helpers/browser';
test('action button keeps width and focus, prevents duplicate work and shows success', async ({
  page,
}) => {
  await page.goto('/feedback');
  const button = page.getByRole('button', { name: '保存设置', exact: true });
  await expect(button).toBeVisible({ timeout: 3000 });
  const width = (await button.boundingBox())!.width;
  await button.focus();
  await button.press('Enter');
  const loading = page.getByRole('button', { name: '正在保存设置…', exact: true });
  await expect(loading).toHaveAttribute('aria-busy', 'true');
  await expect(loading).toHaveAttribute('aria-disabled', 'true');
  await expect(loading).toBeFocused();
  await loading.dispatchEvent('click');
  const saved = page.getByRole('button', { name: '设置已保存', exact: true });
  await expect(saved).toBeVisible();
  expect(Math.abs((await saved.boundingBox())!.width - width)).toBeLessThan(1);
  await expect(page.getByText('演示配置：第 2 版', { exact: true })).toBeVisible();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
});
test('button failure is retryable and detailed export feedback uses an actionable toast', async ({
  page,
}) => {
  await page.goto('/feedback');
  await page.getByRole('switch', { name: '模拟按钮失败' }).check({ timeout: 3000 });
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await expect(page.getByRole('button', { name: '重试保存', exact: true })).toHaveAttribute(
    'data-action-state',
    'error',
  );
  await expect(page.getByRole('alert')).toContainText('保存未完成');
  await page.getByRole('switch', { name: '模拟按钮失败' }).uncheck();
  await page.getByRole('button', { name: '重试保存', exact: true }).click();
  await expect(page.getByRole('button', { name: '设置已保存', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
  await page.getByRole('button', { name: '导出报告', exact: true }).click();
  await expect(page.getByRole('button', { name: '报告已完成', exact: true })).toBeVisible();
  await page.locator('[data-sonner-toast]').getByRole('button', { name: '查看详情' }).click();
  await expect(page.getByRole('dialog')).toContainText('没有创建或下载真实文件');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '报告已完成', exact: true })).toBeFocused();
});
test('action button respects reduced motion on touch and semantic colors in both themes', async ({
  newContext,
}) => {
  const context = await newContext({
    viewport: { width: 390, height: 850 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  for (const theme of ['light', 'dark']) {
    await page.goto('/feedback');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    const button = page.getByRole('button', { name: '保存设置', exact: true });
    const initial = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    await button.tap();
    const loading = page.getByRole('button', { name: '正在保存设置…', exact: true });
    expect(
      await loading
        .locator('.ds-action-spinner')
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    const done = page.getByRole('button', { name: '设置已保存', exact: true });
    await expect(done).toBeVisible();
    expect(await done.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(initial);
    expect(await done.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
    const successColor = await done.evaluate(elementBackground);
    expect(successColor[1]).toBeGreaterThanOrEqual(successColor[0]);
    await page.getByRole('switch', { name: '模拟按钮失败' }).check();
    await done.tap();
    const failed = page.getByRole('button', { name: '重试保存', exact: true });
    await expect(failed).toBeVisible();
    expect(await failed.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
    expect((await failed.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('completed form buttons remain readable when disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark']) {
    await page.goto('/settings');
    await page.evaluate((value) => localStorage.setItem('cqu-moe-theme', value), theme);
    await page.reload();
    await page.getByLabel('显示名称', { exact: true }).fill('已保存的名字');
    const button = page.getByRole('button', { name: '保存显示名称', exact: true });
    await button.click();
    await expect(button).toHaveAttribute('data-action-state', 'success');
    await expect(button).toBeDisabled();
    expect(await button.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await button.evaluate(elementContrast)).toBeGreaterThanOrEqual(4.5);
  }
});
