import {test,expect} from '@playwright/test';

test('search engines receive localized HTML, structured profile, crawl rules and stable language URLs',async({request,page,browser})=>{
 const root=await (await request.get('/')).text();
 expect(root).toContain('application/ld+json');
 expect(root).toContain('Twinby');
 for(const [locale,name] of [['ru','Артем Летюшев'],['en','Artem Letyushev'],['kk','Артем Летюшев']]){
  const response=await request.get(`/${locale}.html`);expect(response.ok()).toBeTruthy();const html=await response.text();
  expect(html).toContain(`<html lang="${locale}">`);expect(html).toContain(`<h1 aria-label="${name}">`);
  expect(html).toContain(`<title>${locale==='kk'?'Техникалық жобалар менеджері — Артем Летюшев':locale==='en'?'Tech Project Manager — Artem Letyushev':'Tech Project Manager — Артем Летюшев'}</title>`);
  expect((html.match(/rel="preload"[^>]+as="font"/g)||[]).length).toBe(2);
  for(const id of ['home-link','resume-markdown','language-select','contact-cta'])expect(html).toContain(`id="${id}"`);
  if(locale==='ru')expect(html).toContain('id="resume-pdf"');
  else expect(html).not.toContain('/Artem-Letyushev-CV.pdf');
  expect(html).toContain('Renewal Studio');expect(html).toContain('SAFe 5');
  expect(html).not.toContain('rel="canonical"');
  expect(html).not.toContain('hreflang=');
  expect(html).toContain('property="og:image"');expect(html).toContain('name="twitter:card"');
  expect(html).toContain('srcset="/artem-books.webp"');
  expect(html).toContain('srcSet="./artem-reference.webp"');
  expect(html).toContain(`<span>${locale==='en'?'Human':locale==='ru'?'Человек':'Адам'}</span>`);
  const schema=JSON.parse(html.match(/<script id="profile-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  expect(schema['@type']).toBe('ProfilePage');expect(schema.inLanguage).toBe(locale);expect(schema.mainEntity['@type']).toBe('Person');expect(schema.mainEntity.sameAs).toContain('https://github.com/letya999');
  if(locale==='kk'){
   expect(schema.mainEntity.jobTitle).toBe('Техникалық жобалар менеджері');
   expect(schema.description).toContain('Техникалық жобалар менеджері');
  }
  expect(schema.mainEntity.alternateName).toEqual(expect.arrayContaining(['Артем Летюшев','Artem Letyushev']));
 }
 expect(await (await request.get('/robots.txt')).text()).toContain('User-agent: *\nAllow: /');
 const context=await browser.newContext({javaScriptEnabled:false});const staticPage=await context.newPage();await staticPage.goto('/en.html');await expect(staticPage.locator('h1')).toHaveAttribute('aria-label','Artem Letyushev');await expect(staticPage.locator('main')).toContainText('Twinby');await expect(staticPage.locator('.portrait-fallback')).toBeVisible();await context.close();
 await page.goto('/kk.html?view=agent');await expect(page.locator('html')).toHaveAttribute('lang','kk');
 await page.locator('select').selectOption('en');await expect(page).toHaveURL(/en\.html\?view=agent/);await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
 await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content','Tech Project Manager — Artem Letyushev');
 await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content',/7\+ years/);
 await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content','en_US');
 await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content','/en.html');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');
 for(const lang of ['ru','en','kk','x-default'])await expect(page.locator(`head link[hreflang="${lang}"]`)).toHaveCount(0);
});
