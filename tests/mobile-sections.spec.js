import {test,expect} from '@playwright/test';

test('mobile practice cards and conveyor stay usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);});});
 await page.goto('/ru.html#practice');
 const practice=page.locator('#practice');
 await expect(practice.locator('.practice-canvas')).toBeVisible();
 await practice.screenshot({path:'qa/mobile-practice.png'});
 await page.locator('#conveyor').scrollIntoViewIfNeeded();
 await expect(page.locator('#conveyor canvas')).toBeVisible();
 await page.locator('#conveyor').screenshot({path:'qa/mobile-conveyor.png'});
 const logoScales=await page.evaluate(()=>window.scenes.flatMap(scene=>scene.children).filter(model=>model.name.startsWith('conveyor:logo:')).map(model=>model.scale.x));
 expect(Math.max(...logoScales),'Mobile resource marks should be legible').toBeGreaterThan(.45);
 const rollerSpan=await page.evaluate(()=>{const rollers=window.scenes.flatMap(scene=>scene.children).filter(model=>model.name.startsWith('conveyor:roller:'));return Math.abs(rollers[1].position.x-rollers[0].position.x);});
 expect(rollerSpan,'Mobile conveyor needs its own compact camera composition').toBeLessThan(6);
 const layout=await practice.evaluate(section=>({section:section.clientWidth,cards:[...section.querySelectorAll('.practice-area')].map(card=>card.getBoundingClientRect().width),buttons:[...section.querySelectorAll('.practice-more')].map(button=>button.getBoundingClientRect().width)}));
 expect(Math.min(...layout.cards)).toBeGreaterThan(layout.section*.8);
 expect(Math.min(...layout.buttons)).toBeGreaterThanOrEqual(44);
 await practice.getByRole('button',{name:/Узнать подробнее: Продукт/}).click();
 await expect(practice.locator('dialog')).toBeVisible();
 await practice.getByRole('button',{name:'Закрыть диалог'}).click();
 await expect(practice.locator('dialog')).toBeHidden();
 await page.setViewportSize({width:320,height:700});
 await practice.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await practice.locator('.practice-more').first().evaluate(button=>button.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
});
