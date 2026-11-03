import {test,expect} from '@playwright/test';
test('localized static pages provide truthful metadata and readable no-JavaScript content',async({request,browser})=>{
 const roles={ru:'Руководитель IT-проектов',en:'Technical Project Manager',kk:'IT жобаларының жетекшісі'};
 for(const locale of ['ru','en','kk']){
  const response=await request.get('/'+locale+'.html');expect(response.ok()).toBe(true);const html=await response.text();
  expect(html).toContain('<html lang="'+locale+'">');expect(html).toContain('<title>'+roles[locale]);
  const schema=JSON.parse(html.split('<script id="profile-schema" type="application/ld+json">')[1].split('</script>')[0]);expect(schema.mainEntity.jobTitle).toBe(roles[locale]);expect(schema.dateModified).toBe('2026-11-04');expect(schema.mainEntity.sameAs).toContain('https://github.com/letya999');
  expect(html).toContain(`href="/resume.${locale}.pdf"`);expect(html).toContain('property="og:image"');
 }
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('/en');await expect(page.locator('.hero h1')).toHaveAttribute('aria-label','Artem Letyushev');await expect(page.locator('.achievement-list article')).toHaveCount(6);await expect(page.locator('.portrait-fallback')).toBeVisible();await page.locator('#experience summary').first().click();await expect(page.locator('.job-results').first()).toBeVisible();await context.close();
});
