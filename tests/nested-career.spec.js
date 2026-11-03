import {test,expect} from '@playwright/test';
test('nested dolls travel continuously and reverse when scrolling back',async({page})=>{
 await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);});});
 await page.goto('/ru');await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
 const offsets=await page.evaluate(()=>[...document.querySelectorAll('.matryoshka-slot')].slice(0,2).map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2-innerHeight*.45;}));
 const stage=()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.userData.dollOpen)?.userData.stage.value);
 const sample=async(y,expected)=>{await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await expect(page.locator('.portrait-stage')).toHaveAttribute('data-scene','experience');await expect.poll(stage).toBeCloseTo(expected,1);return stage();};
 await sample(offsets[0],0);
 const easing=await page.evaluate(async y=>{
  const doll=window.scenes.flatMap(s=>s.children).find(m=>m.userData.dollOpen),values=[];
  scrollTo({top:y,behavior:'instant'});const started=performance.now();
  while(performance.now()-started<200){await new Promise(requestAnimationFrame);values.push(doll.userData.stage.value);}
  return values;
 },(offsets[0]+offsets[1])/2);
 expect(easing.some(v=>v>.01&&v<.4),'A scroll step must pass through intermediate poses').toBe(true);
 expect(easing.every((v,i)=>!i||v>=easing[i-1]-.001),'Forward progress must not oscillate').toBe(true);
 const forward=await sample((offsets[0]+offsets[1])/2,.5);expect(forward).toBeGreaterThan(.2);expect(forward).toBeLessThan(.8);
 await sample(offsets[1],1);
 await sample((offsets[0]+offsets[1])/2,forward);
 await sample(offsets[0],0);
 await page.emulateMedia({reducedMotion:'reduce'});
 await sample(offsets[0]+(offsets[1]-offsets[0])*.75,1);expect(Number.isInteger(await stage())).toBe(true);
});
