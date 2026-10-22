import {test,expect} from '@playwright/test';

test('reduced motion renders static sculptures once and preference changes take effect without scrolling',async({page})=>{
  const check=expect.configure({soft:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    window.draws=0;window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{
      if(typeof detail.render==='function'){const render=detail.render;detail.render=function(...args){window.draws++;return render.apply(this,args);};}
    });
  });
  await page.goto('/');await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
  for(const id of ['experience','home']){
    await page.evaluate(id=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,id==='home'?0:document.querySelector('#'+id).offsetTop);},id);
    await page.waitForTimeout(300);
    const before=await page.evaluate(()=>window.draws);await page.waitForTimeout(250);
    check((await page.evaluate(()=>window.draws))-before,`The static ${id} sculpture must not keep drawing`).toBeLessThanOrEqual(1);
  }
  await page.evaluate(()=>scrollTo(0,document.querySelector('#results').offsetTop));
  await expect.poll(()=>page.locator('#results').evaluate(e=>Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await expect(page.locator('.portrait-stage')).toHaveAttribute('data-equation-progress','0');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await check(page.locator('.portrait-stage')).toHaveAttribute('data-equation-progress','1');
});
