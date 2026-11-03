import {test,expect} from '@playwright/test';

test('reduced motion renders static sculptures once and preference changes take effect without scrolling',async({page})=>{
  const check=expect.configure({soft:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    window.draws=0;window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{
      if(detail.isScene)window.scenes.push(detail);
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
  await page.evaluate(()=>{const p=[...document.querySelectorAll('.matryoshka-slot')].slice(0,2).map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2-innerHeight*.45;});scrollTo(0,p[0]+(p[1]-p[0])*.75);});
  const stage=()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.userData.dollOpen)?.userData.stage.value);
  await expect.poll(stage).toBe(1);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(stage).toBeCloseTo(.75,1);
});
