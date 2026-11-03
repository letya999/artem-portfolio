import {test,expect} from '@playwright/test';
test('all five section links and the resume menu fit in every language',async({page})=>{
 for(const locale of ['ru','en','kk'])for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});await page.goto('/'+locale);
  const nav=page.locator('.human-shell > header nav');await expect(nav.locator('a')).toHaveCount(5);
  const fits=await nav.evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('a')].every(a=>{const b=a.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1;});});expect(fits,locale+' '+width).toBe(true);
  const menu=page.locator('.resume-menu');await menu.locator('summary').focus();await page.keyboard.press('Enter');await expect(menu.locator('#resume-pdf')).toBeVisible();
  for(const [id,format] of [['resume-pdf','pdf'],['resume-markdown','md']]){await expect(menu.locator('#'+id)).toHaveAttribute('href',`/resume.${locale}.${format}`);await expect(menu.locator('#'+id)).toHaveAttribute('hreflang',locale);}
  await page.keyboard.press('Escape');await expect(menu).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
