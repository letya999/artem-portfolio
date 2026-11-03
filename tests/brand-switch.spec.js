import {test,expect} from '@playwright/test';
test('compact 3D rockers select the current mode through native view links',async({page})=>{
 await page.goto('/en?view=human');await expect(page.locator('.view-dock a')).toHaveCount(2);await expect(page.locator('.view-dock a').first()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock')).toHaveCSS('position','fixed');expect((await page.locator('.view-dock').boundingBox()).width).toBeLessThanOrEqual(124);
 for(const key of await page.locator('.view-dock a').all()){expect((await key.boundingBox()).height).toBeGreaterThanOrEqual(44);expect(await key.evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');}
 await page.locator('.view-dock a').last().click();await expect(page).toHaveURL(/view=agent/);await expect(page.locator('.view-dock a').last()).toHaveAttribute('aria-current','page');
 await page.locator('.view-dock a').first().click();await expect(page).toHaveURL(/view=human/);await expect(page.locator('.hero h1')).toBeVisible();
});
