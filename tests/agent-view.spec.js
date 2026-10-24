import {test,expect} from '@playwright/test';
import {jobs,businesses} from '../src/portfolio-data.js';
import {areas,content} from '../src/practice-data.js';
test('agent URL is plain localized Markdown without WebGL and offers a matching downloadable resume',async({page})=>{
 const models=[];page.on('request',r=>{if(/voxel-portrait|head-contours/.test(r.url()))models.push(r.url());});
 await page.goto('/?view=agent');
 await expect.soft(page.locator('canvas')).toHaveCount(0,{timeout:200});
 const text=await page.locator('body').innerText();expect.soft(text).toContain('# Артем Летюшев');expect.soft(text).toContain('## Опыт работы');expect.soft(text).toContain('SAFe 5');expect.soft(models).toEqual([]);
 await expect.soft(page.locator('.view-dock a')).toHaveCount(2,{timeout:200});
 const md=await page.request.get('/resume.ru.md');expect.soft(md.headers()['content-type']).toContain('text/');expect.soft(await md.text()).toContain('# Артем Летюшев');
 const markdown=await md.text();
 for(const [language,title] of [['en','# Artem Letyushev'],['kk','# Артем Летюшев']]){const response=await page.request.get(`/resume.${language}.md`);expect.soft(await response.text()).toContain(title);}
 for(const value of ['Tech Project Manager','Соединяю инженерию, команды и бизнес.','7+ лет. Финтех, телеком, дейтинг.','https://t.me/artemletya','https://github.com/letya999','https://www.linkedin.com/in/artemletya','https://vc.ru/id458029','https://github.com/letya999/ai-stp'])expect.soft(markdown).toContain(value);
 const missing=[...jobs.flat(3),...Object.values(businesses),...areas.flat(),...content.flat(4)].filter(value=>!markdown.includes(value));expect.soft(missing,'Markdown must preserve every published resume fact and skill').toEqual([]);
 for(const required of ['### Twinby — Tech Project Manager','### Renewal Studio','## Процессы','## Инженерия','## Продукт','## Публикации и проекты','artemletyushev@gmail.com','https://habr.com/ru/users/Renewal_Studio/','https://github.com/letya999/job_ftch','64 до 16','SAFe 5'])expect.soft(markdown).toContain(required);
 if(await page.locator('select').count())await page.locator('select').selectOption('en');
 await expect.soft(page.locator('body')).toContainText('# Artem Letyushev');
 await page.goto('/');await expect(page.locator('header a[download$=".md"]')).toHaveCount(1);
});
