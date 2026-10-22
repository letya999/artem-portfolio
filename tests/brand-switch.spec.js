import {test,expect} from '@playwright/test';

test('the brand, paper headline and exclusive rocker modes work in both views',async({page})=>{
 await page.goto('/en.html?view=human#about');
 await expect(page.locator('header .mark img')).toHaveAttribute('src','./favicon.svg');
 await expect(page.locator('.about-copy h2')).toHaveClass(/about-sticker/);
 await expect(page.locator('.view-dock a')).toHaveCount(2);
 expect(await page.locator('.view-dock').evaluate(element=>getComputedStyle(element).flexDirection)).toBe('column');
 expect(await page.locator('.view-dock a[aria-current]').evaluate(element=>getComputedStyle(element).animationName)).not.toBe('none');
 await expect(page.locator('.view-dock a').first()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock a').last()).not.toHaveAttribute('aria-current','page');
 await page.locator('.view-dock a').last().click();
 await expect(page).toHaveURL(/view=agent/);
 await expect(page.locator('.view-dock a').last()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock a').first()).not.toHaveAttribute('aria-current','page');
 for(const path of ['/favicon.svg','/apple-touch-icon.png','/site.webmanifest']){
  const response=await page.request.get(path);
  expect(response.ok(),path).toBe(true);
  expect(response.headers()['content-type'],path).not.toContain('text/html');
 }
});
