import {test,expect} from '@playwright/test';
import {jobs,businesses,profileRole,profileLead} from '../src/portfolio-data.js';
import {content} from '../src/practice-data.js';
test('AI view displays the same raw Markdown as its download in every language without WebGL',async({page})=>{
 const models=[];page.on('request',r=>{if(/voxel-portrait|head-contours/.test(r.url()))models.push(r.url());});
 await page.goto('/ru?view=agent');
 for(const locale of ['ru','en','kk']){
  if(locale!=='ru')await page.locator('select').selectOption(locale);
  await expect(page).toHaveURL(new RegExp(`/${locale}\\?view=agent`));
  const raw=page.locator('.agent-shell pre'),download=await page.request.get(`/resume.${locale}.md`);expect(download.ok()).toBe(true);
  await expect(raw).toBeVisible();expect(await raw.textContent()).toBe(await download.text());
  await expect(raw).toHaveCSS('white-space','pre-wrap');expect(await raw.evaluate(e=>getComputedStyle(e).fontFamily)).toContain('monospace');
  await expect(page.locator('.agent-shell h1,.agent-shell article,canvas')).toHaveCount(0);
  await expect(page.locator('.agent-shell header a[download]')).toHaveAttribute('href',`/resume.${locale}.md`);
  if(locale==='en')await expect(raw).not.toContainText(/[А-Яа-яЁё]/);
 }
 await page.setViewportSize({width:390,height:844});
 expect(await page.locator('.agent-shell pre').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(models).toEqual([]);
 const markdown=await(await page.request.get('/resume.ru.md')).text();
 for(const value of [profileRole,profileLead,...jobs.flat(Infinity),...Object.values(businesses),...content.flat(Infinity)])expect(markdown).toContain(value);
});
