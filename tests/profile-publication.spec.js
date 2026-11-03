import {test,expect as baseExpect} from '@playwright/test';
import {jobs,achievements,biography} from '../src/portfolio-data.js';
import {content} from '../src/practice-data.js';
test.use({reducedMotion:'reduce'});
const expect=baseExpect.configure({soft:true,timeout:1000});

test('approved profile and Derwalde identity reach HTML, translations and agent resources',async({page,request})=>{
 await page.goto('/ru.html?view=human');
 await expect(page.locator('.role')).toHaveText('Руководитель IT-проектов');
 await expect(page.locator('.achievement-list article')).toHaveCount(6);
 for(const entry of await page.locator('.career-entry').all()){
  await expect(entry.locator('.job-results li')).toHaveCount(5);
  await expect(entry.locator('.job-responsibilities li')).toHaveCount(5);
 }
 await expect(page.locator('.about-copy h2')).toHaveText('Обо мне.');
 await expect(page.locator('.about-copy')).toContainText('Curestry');
 await expect(page.locator('.little-law > p')).toHaveCount(0);
 await expect(page.locator('#practice')).toHaveCount(0);
 for(const [index,terms] of [[0,['Направления','Примеры проектов','Методы и инструменты','С кем работал','Образование и сертификации']],[1,['Направления','Примеры проектов','Технологии и инструменты','С кем работал','Подготовка']],[2,['Домены и направления','Примеры продуктов','Методы и инструменты','С кем работал','Образование']]]){
  expect(content[index][1].map(([title])=>title),`practice ${index}: agreed five lenses`).toEqual(terms);
 }
 const logo=page.locator('header .mark');
 await expect(logo).toContainText('Artem Letyushev');
  await expect(page).toHaveTitle('Руководитель IT-проектов — Артем Летюшев');
 const mono=logo.locator('.logo-mono'),color=logo.locator('.logo-color');
 await expect(mono).toHaveCSS('opacity','1');await expect(color).toHaveCSS('opacity','0');
 await logo.hover();await expect(color).toHaveCSS('opacity','1');await expect(mono).toHaveCSS('opacity','0');
 await page.mouse.move(0,100);await logo.focus();await expect(color).toHaveCSS('opacity','1');
 for(const img of await logo.locator('img').all())expect(await img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 for(const [locale,name] of [['ru','Артем Летюшев'],['en','Artem Letyushev'],['kk','Артем Летюшев']]){
  const html=await (await request.get(`/${locale}.html`)).text();
  const schema=JSON.parse(html.match(/<script id="profile-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  expect(schema.mainEntity.name).toBe(name);expect(schema.mainEntity.jobTitle).toBe({ru:'Руководитель IT-проектов',en:'Technical Project Manager',kk:'IT жобаларының жетекшісі'}[locale]);
  expect(schema.mainEntity.alternateName).not.toContain('Derwalde');
  expect(schema.dateModified).toBe('2026-11-04');
  for(const value of ['Amundsen','Curestry','CustDev','CJM','GovTech','Betting','Crypto','Data Science','SAFe 5'])expect(html,`${locale}: ${value}`).toContain(value);
  const markdown=await (await request.get(`/resume.${locale}.md`)).text();
  if(locale==='ru'){
   const missing=[...jobs.flat(Infinity),...achievements.flat(Infinity),...biography,...content.flat(Infinity)].filter(value=>!markdown.includes(value));
   expect(missing,'Markdown must include the published projects, responsibilities, cases and biography').toEqual([]);
   expect(html.includes('Продакт-менеджер по образованию.'),'education in agent template').toBe(true);
   expect(html.includes('Практический опыт:'),'distinguish own engineering experience from team technology').toBe(true);
   expect(html.includes('Технологический контекст проектов:'),'project technology context in static HTML').toBe(true);
   for(const value of ['Amundsen','API-контракты'])expect(html.includes(value),`static practice: ${value}`).toBe(true);
  }
  expect(markdown).toContain(locale==='kk'?'Техникалық жобалар менеджері':'Tech Project Manager');expect(markdown).toContain('Curestry');expect(markdown).toContain('Amundsen');expect(markdown).not.toContain('Derwalde');
  expect(markdown).not.toMatch(/Tech \/ Delivery Project Manager|Curestry.{0,60}HealthTech/);
  if(locale==='en')expect(markdown).not.toMatch(/[А-Яа-яЁё]/);
  expect(await (await request.get(`/skills/artem-portfolio/references/profile.${locale}.md`)).text()).toBe(markdown);
 }
 for(const path of ['/skill.md','/agents.md','/llms.txt']){const text=await (await request.get(path)).text();expect(text).toContain('Artem Letyushev');expect(text).not.toContain('Derwalde');}
 const mcp=await (await request.get('/mcp.json')).json();expect(mcp.instructions).toContain('/skill.md');
 const manifest=await (await request.get('/site.webmanifest')).json();expect(manifest.short_name).toBe('Artem Letyushev');
 for(const path of ['/favicon.svg','/favicon.ico','/apple-touch-icon.png',...manifest.icons.map(i=>i.src)]){
  const response=await request.get(path);expect(response.ok(),path).toBe(true);expect((await response.body()).length,path).toBeGreaterThan(400);
 }
});
