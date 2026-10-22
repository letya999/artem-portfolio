import {test,expect} from '@playwright/test';
test('compact machined conveyor has thin unframed logos, grooves, rollers, feed and falling output',async({page})=>{
 await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);});});
 await page.goto('/#conveyor');await page.locator('#conveyor').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
 const data=await page.evaluate(()=>{
  const children=window.scenes.flatMap(s=>s.children),logos=children.filter(m=>m.name.startsWith('conveyor:logo:'));
  return {thin:logos.length===5&&logos.every(m=>{m.computeBoundingBox();const b=m.boundingBox;return b.max.z-b.min.z<.3*(b.max.x-b.min.x);}),angle:logos.every(m=>Math.abs(m.rotation.y)<.35),metal:logos.every(m=>m.material.metalness>.95),rollers:children.filter(m=>m.name.startsWith('conveyor:roller')).length,feed:children.some(m=>m.name==='conveyor:feed'),height:document.querySelector('#conveyor').getBoundingClientRect().height};
 });
 expect.soft(data.thin).toBe(true);expect.soft(data.angle).toBe(true);expect.soft(data.metal).toBe(true);expect.soft(data.rollers).toBeGreaterThanOrEqual(2);expect.soft(data.feed).toBe(true);expect.soft(data.height).toBeLessThan(470);
 const pose=await page.evaluate(async()=>{try{const m=await import('/src/conveyor-motion.js');return [m.conveyorPose(0,0,12),m.conveyorPose(13,0,12),m.conveyorPose(0,1,12),m.conveyorPose(15,0,12)];}catch{return null;}});
 expect.soft(pose).not.toBeNull();if(pose){expect.soft(pose[3]).toEqual(pose[0]);expect.soft(pose[0].x).toBe(0);expect.soft(pose[1].y).toBeLessThan(pose[0].y);expect.soft(pose[1].rotation).toBeGreaterThan(0);expect.soft(pose[2].x).toBeGreaterThan(pose[0].x);}
 const marks=await page.evaluate(async()=>Object.fromEntries(await Promise.all(['github','telegram','linkedin','habr','vc'].map(async n=>[n,await(await fetch('/brand-marks/'+n+'.svg')).text()]))));
 expect.soft(marks.github).not.toContain('M12 .297');expect.soft(marks.telegram).not.toContain('A12 12');expect.soft(marks.linkedin).not.toContain('M22.225');expect.soft(marks.habr).toContain('Хабр.ru');expect.soft(marks.vc).toContain('vc.ru');
});

