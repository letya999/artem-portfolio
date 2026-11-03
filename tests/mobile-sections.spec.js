import {test,expect} from '@playwright/test';
test('mobile offers stable resource links, a useful back-to-top button and an unobtrusive view switch',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/ru');
 const back=page.locator('.back-to-top');await expect(back).toBeHidden();
 await page.locator('#experience').scrollIntoViewIfNeeded();await expect(back).toBeVisible();await back.click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(10);
 await page.locator('#conveyor').scrollIntoViewIfNeeded();await expect(page.locator('.resource-links a')).toHaveText(['Habr','GitHub','LinkedIn','Telegram','vc.ru']);
 for(const a of await page.locator('.resource-links a').all()){expect(new URL(await a.getAttribute('href')).protocol).toBe('https:');expect((await a.boundingBox()).height).toBeGreaterThanOrEqual(44);}
 await page.locator('#contact').scrollIntoViewIfNeeded();await expect(back).toBeHidden();expect(await page.locator('.view-dock').evaluate(e=>getComputedStyle(e).position)).toBe('relative');
 await expect(page.locator('#contact .primary')).toBeVisible();
});
