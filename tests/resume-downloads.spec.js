import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.use({reducedMotion:'reduce'});

test('changing the site language selects that language for actual PDF and Markdown downloads',async({page,request})=>{
 const roles={ru:'Руководитель IT-проектов',en:'Technical Project Manager',kk:'IT жобаларының жетекшісі'};
 await page.goto('/ru');
 for(const locale of ['ru','en','kk']){
  if(locale!=='ru')await page.locator('select[data-language]').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  for(const format of ['pdf','md']){
   await page.locator('.resume-menu summary').click();
   const link=page.locator(format==='pdf'?'#resume-pdf':'#resume-markdown');
   const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
   expect(await download.failure()).toBeNull();expect(download.suggestedFilename()).toBe(`Artem-Letyushev-${locale}.${format}`);
   const bytes=await readFile(await download.path());
   if(format==='pdf'){
    expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(bytes.length).toBeGreaterThan(10000);
    expect(bytes.toString('latin1')).toMatch(new RegExp(`/Lang\\s*\\(${locale}\\)`));
    expect((await request.get(`/resume.${locale}.pdf`)).headers()['content-type']).toContain('application/pdf');
   }else expect(bytes.toString('utf8')).toContain(roles[locale]);
  }
  await expect(page.locator('footer a[download]')).toHaveAttribute('href',`/resume.${locale}.pdf`);
  await expect(page.locator('footer a[download]')).toHaveAttribute('download',`Artem-Letyushev-${locale}.pdf`);
 }
});
