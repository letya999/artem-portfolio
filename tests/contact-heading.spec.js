import {test,expect} from '@playwright/test';
test('contact heading is a heading and the call to action opens Telegram',async({page})=>{await page.goto('/ru');await expect(page.locator('#contact h2')).toHaveText('Обсудим работу.');await expect(page.locator('#contact h2 a')).toHaveCount(0);await expect(page.locator('#contact .primary')).toHaveAttribute('href','https://t.me/artemletya');});
