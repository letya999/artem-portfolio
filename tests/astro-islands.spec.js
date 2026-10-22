import {test,expect} from '@playwright/test';

test('localized pages render useful HTML before the three interactive islands hydrate',async({request,browser})=>{
 const response=await request.get('/en.html');
 const html=await response.text();
 expect(response.ok()).toBe(true);
 expect(html).toContain('id="results"');
 expect(html).toContain('id="experience"');
 expect(html).toContain('id="about"');
 expect((html.match(/<astro-island\b/g)||[]).length).toBe(3);
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();
 await page.goto('/en.html');
 await expect(page.locator('#about h2')).toContainText('A manager.');
 await expect(page.locator('#experience details')).toHaveCount(6);
 await context.close();
});
