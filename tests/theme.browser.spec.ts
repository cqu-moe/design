import { test, expect } from '@playwright/test';
test('honors stored theme before application renders', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('cqu-moe-theme','dark'));
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(0, 0, 0)');
});
test('invalid preference follows system', async ({page}) => {
  await page.emulateMedia({colorScheme:'dark'});
  await page.addInitScript(()=>localStorage.setItem('cqu-moe-theme','corrupt'));
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('storage denied still renders', async ({page}) => {
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}}));
  await page.goto('/'); await expect(page.getByRole('heading').first()).toBeVisible();
});
