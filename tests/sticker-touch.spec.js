import {test,expect} from '@playwright/test';

test.use({hasTouch:true,viewport:{width:390,height:844}});

test('touch can peel the sticker and open the story',async({page})=>{
 await page.goto('/ru.html');
 await page.locator('.sticker-paper').tap();
 await expect(page.locator('.sticker-paper')).toHaveAttribute('aria-expanded','true');
 await page.locator('.story-trigger').tap();
 await expect(page.locator('.story-dialog')).toBeVisible();
});
