import { test, expect } from '@playwright/test';
test('shared controls provide names, disabled state and dialog focus return', async ({page})=>{
 await page.goto('/components');
 await expect(page.getByRole('button',{name:'不可用操作'})).toBeDisabled({timeout:3000});
 await page.getByText('示例名称',{exact:true}).click(); await expect(page.getByLabel('示例名称')).toBeFocused();
 const trigger=page.getByRole('button',{name:'打开弹窗'}); await trigger.focus(); await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(trigger).toBeFocused();
});
test('theme switches survive reload and system changes',async({page})=>{
 await page.goto('/components'); await page.getByRole('button',{name:'深色',exact:true}).click({timeout:3000});
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await page.emulateMedia({colorScheme:'light'});
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'跟随系统',exact:true}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.emulateMedia({colorScheme:'dark'}); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
