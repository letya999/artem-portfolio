import {test,expect} from '@playwright/test';

test('search engines receive localized HTML, structured profile, crawl rules and stable language URLs',async({request,page,browser})=>{
 const root=await (await request.get('/')).text();
 expect(root).toContain('application/ld+json');
 expect(root).toContain('Twinby');
 for(const [locale,name] of [['ru','Артем Летюшев'],['en','Artem Letyushev'],['kk','Артем Летюшев']]){
  const response=await request.get(`/${locale}.html`);expect(response.ok()).toBeTruthy();const html=await response.text();
  expect(html).toContain(`<html lang="${locale}">`);expect(html).toContain(`<h1>${name}</h1>`);
  expect(html).toContain('Renewal Studio');expect(html).toContain('SAFe 5');
  expect(html).toContain(`rel="canonical" href="/${locale}.html"`);
  for(const lang of ['ru','en','kk','x-default'])expect(html).toContain(`hreflang="${lang}"`);
  expect(html).toContain('property="og:image"');expect(html).toContain('name="twitter:card"');
  const schema=JSON.parse(html.match(/<script id="profile-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  expect(schema['@type']).toBe('ProfilePage');expect(schema.inLanguage).toBe(locale);expect(schema.mainEntity['@type']).toBe('Person');expect(schema.mainEntity.sameAs).toContain('https://github.com/letya999');
  expect(schema.mainEntity.alternateName).toBe(locale==='en'?'Артем Летюшев':'Artem Letyushev');
 }
 expect(await (await request.get('/robots.txt')).text()).toContain('User-agent: *\nAllow: /');
 const context=await browser.newContext({javaScriptEnabled:false});const staticPage=await context.newPage();await staticPage.goto('/en.html');await expect(staticPage.locator('h1')).toHaveText('Artem Letyushev');await expect(staticPage.locator('main')).toContainText('Twinby');await context.close();
 await page.goto('/kk.html?view=agent');await expect(page.locator('html')).toHaveAttribute('lang','kk');
 await page.locator('select').selectOption('en');await expect(page).toHaveURL(/en\.html\?view=agent/);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','/en.html');
 await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content','Artem Letyushev — Tech / Delivery Project Manager');
 await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content',/7\+ years/);
 await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content','en_US');
 await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content','/en.html');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');
 for(const lang of ['ru','en','kk','x-default'])await expect(page.locator(`head link[hreflang="${lang}"]`)).toHaveCount(1);
});
