import {test,expect} from '@playwright/test';
test('six XYZ outcomes cover Twinby, NDA and MTS without overflow',async({page})=>{
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});await page.goto('/ru');
  await expect(page.locator('.achievement-list h3')).toHaveText(['В 2,5 раза меньше','64 → 16 дней','+15%','−20%','+15%','2 → 1,5 мес.']);
  await expect(page.locator('.achievement-label')).toHaveText(['Twinby · Количество мошенников','Twinby · Срок выполнения задач','Финтех · Удержание пользователей','Финтех · Интервал между релизами','МТС · Выполнение квартальных планов','МТС · Вывод изменений на рынок']);
  await expect(page.locator('.achievement-context')).toHaveCount(6);
  for(const description of await page.locator('.achievement-context').all())expect((await description.innerText()).length).toBeGreaterThan(80);
  await expect(page.locator('.little-law,#practice')).toHaveCount(0);
  const layout=await page.locator('#results').evaluate(e=>({width:e.scrollWidth,client:e.clientWidth,height:e.getBoundingClientRect().height,body:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(layout.width).toBeLessThanOrEqual(layout.client);expect(layout.body).toBeLessThanOrEqual(layout.viewport);
 }
});

test('hero and all six results fit separate screens at the supplied window sizes and 125% scale',async({browser})=>{
 for(const [width,height,dpr] of [[1515,682,1.25],[1496,680,1.25],[1894,853,1]])for(const locale of ['ru','en','kk']){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'}),page=await context.newPage();
  try{
   await page.goto('/'+locale);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.portrait-sticker')).toBeVisible();
   const hero=await page.locator('.hero').boundingBox();expect(Math.abs(hero.y+hero.height-height),`${locale} ${width}: next chapter starts below the first screen`).toBeLessThan(2);
   for(const selector of ['.hero h1','.hero .primary','.portrait-stage','.portrait-sticker']){
    const box=await page.locator(selector).boundingBox();expect(box.y,selector).toBeGreaterThanOrEqual(79);expect(box.y+box.height,selector).toBeLessThanOrEqual(height);expect(box.x,selector).toBeGreaterThanOrEqual(0);expect(box.x+box.width,selector).toBeLessThanOrEqual(width);
   }
   await page.locator('header nav a[href="#results"]').click();
   await expect.poll(()=>page.locator('#results').evaluate(e=>Math.abs(e.getBoundingClientRect().top-document.querySelector('.human-shell > header').getBoundingClientRect().bottom))).toBeLessThan(2);
   const results=await page.locator('#results').boundingBox();expect(Math.abs(results.y+results.height-height),`${locale} ${width}: results fill the second screen`).toBeLessThan(2);
   await expect(page.locator('.achievement-context')).toHaveCount(6);
   const fit=await page.locator('#results').evaluate(e=>{
    const dock=document.querySelector('.view-dock').getBoundingClientRect();
    return [...e.querySelectorAll('h2,h3,p')].map(p=>{const r=document.createRange();r.selectNodeContents(p);const b=r.getBoundingClientRect();return {text:p.textContent,top:b.top,bottom:b.bottom,clipped:getComputedStyle(p).overflowY!=='visible'&&p.scrollHeight>p.clientHeight+1,covered:b.left<dock.right&&b.right>dock.left&&b.top<dock.bottom&&b.bottom>dock.top};});
   });
   for(const item of fit){expect(item.top,item.text).toBeGreaterThanOrEqual(79);expect(item.bottom,item.text).toBeLessThanOrEqual(height-8);expect(item.clipped,item.text).toBe(false);expect(item.covered,item.text).toBe(false);}
  }finally{await context.close();}
 }
});
