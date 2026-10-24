import {test,expect} from '@playwright/test';

test('the brand, paper headline and exclusive rocker modes work in both views',async({page})=>{
 await page.goto('/en.html?view=human#about');
 await expect(page.locator('header .mark .logo-mono')).toHaveAttribute('src','/brand/logo-mono.png');
 await expect(page.locator('header .mark .logo-color')).toHaveAttribute('src','/brand/logo-color.png');
 await expect(page.locator('.about-copy h2')).toHaveClass(/about-sticker/);
 await expect(page.locator('.view-dock a')).toHaveCount(2);
 expect(await page.locator('.view-dock').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2);
 const dock=await page.locator('.view-dock').boundingBox();expect(dock.width).toBeGreaterThan(dock.height);expect(dock.width).toBeLessThan(130);
 expect(await page.locator('.view-dock a[aria-current]').evaluate(element=>getComputedStyle(element).transitionDuration)).not.toBe('0s');
 await expect(page.locator('.view-dock a').first()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock a').last()).not.toHaveAttribute('aria-current','page');
 await page.locator('.view-dock a').last().click({noWaitAfter:true});
 await expect(page.locator('.view-dock')).toHaveAttribute('data-switching','releasing');
 await expect(page.locator('.view-dock a').first()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock')).toHaveAttribute('data-switching','engaging');
 await expect(page).toHaveURL(/view=agent/);
 await expect(page.locator('.view-dock a').last()).toHaveAttribute('aria-current','page');
 await expect(page.locator('.view-dock a').first()).not.toHaveAttribute('aria-current','page');
 for(const path of ['/favicon.svg','/apple-touch-icon.png','/site.webmanifest']){
  const response=await page.request.get(path);
  expect(response.ok(),path).toBe(true);
  expect(response.headers()['content-type'],path).not.toContain('text/html');
 }
});
