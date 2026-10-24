import {test,expect} from '@playwright/test';

test('contact heading says Давайте шипить',async({page})=>{
 await page.goto('/ru.html#contact');
 await expect(page.locator('#contact h2')).toHaveText('Давайте шипить.');
});
