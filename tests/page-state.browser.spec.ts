import { test, expect } from '@playwright/test';
for (const width of [320, 390, 768, 1440])
  for (const theme of ['light', 'dark'])
    test(`page states preserve recovery and fit ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('cqu-moe-theme', value), theme);
      await page.goto('/items');
      await page.getByRole('searchbox', { name: '搜索服务' }).fill('课表');
      await page.getByText('演示状态', { exact: true }).click();
      const selector = page.getByLabel('列表状态');
      await selector.selectOption('loading');
      await expect(page.getByRole('status')).toContainText('正在加载服务');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(
        await page
          .locator('.ds-page-state > svg')
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none');
      await selector.selectOption('error');
      await expect(page.getByRole('alert')).toContainText('暂时无法加载服务');
      await page.getByRole('button', { name: '重新加载' }).click();
      await expect(page.getByRole('searchbox')).toHaveValue('课表');
      await expect(page.getByRole('link', { name: '课表订阅', exact: true })).toBeVisible();
      await selector.selectOption('empty');
      await expect(page.getByRole('status')).toContainText('还没有服务');
      await selector.selectOption('forbidden');
      await expect(page.getByRole('status')).toContainText('没有查看服务的权限');
      await expect(page.getByRole('table')).toHaveCount(0);
      await expect(page.locator('.list-footer, .preview-badge')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('link', { name: '返回账号设置', exact: true }).click();
      await expect(page).toHaveURL(/settings$/);
    });
