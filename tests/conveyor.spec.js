import {test,expect} from '@playwright/test';

test('a separate dark voxel machine carries uncaptioned metal logos continuously through hover and click',async({page})=>{
  await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);if(typeof detail.render==='function'){const render=detail.render;detail.render=function(s,c){if(s.children.some(m=>m.name==='conveyor:machine'))window.conveyorCamera=c;return render.call(this,s,c);};}});});
  await page.goto('/');
  const structure=await page.evaluate(()=>{
    const s=document.querySelector('#conveyor');return {separate:!!s&&!s.closest('.practice'),afterPractice:!!(s?.previousElementSibling?.id==='practice'||s?.closest('astro-island')?.previousElementSibling?.querySelector('#practice')),pauseButtons:document.querySelectorAll('.conveyor-pause').length,links:s?.querySelectorAll('.conveyor-link').length||0};
  });
  expect.soft(structure).toEqual({separate:true,afterPractice:true,pauseButtons:0,links:5});
  if(!structure.separate)return;
  const section=page.locator('#conveyor');await section.scrollIntoViewIfNeeded();await expect.soft(section.locator('canvas')).toBeVisible({timeout:10000});
  await expect.poll(()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).filter(m=>m.name.startsWith('conveyor:logo:')).length)).toBe(5);
  const sculpture=await page.evaluate(()=>{
    const meshes=[];window.scenes.forEach(s=>s.traverse(m=>{if(m.name.startsWith('conveyor:'))meshes.push(m);}));
    const logos=meshes.filter(m=>m.name.startsWith('conveyor:logo:'));
    return {logos:logos.length,deep:logos.every(m=>{m.computeBoundingBox();const b=m.boundingBox;return b.max.z-b.min.z>.03*(b.max.x-b.min.x);}),metal:logos.every(m=>m.material.metalness>=.8&&m.material.color.r>.35),belt:meshes.find(m=>m.name==='conveyor:belt')?.count||0,machine:meshes.find(m=>m.name==='conveyor:machine')?.count||0,gears:meshes.filter(m=>m.name.startsWith('conveyor:gear:')).length};
  });
  expect.soft(sculpture).toEqual({logos:5,deep:true,metal:true,belt:expect.any(Number),machine:expect.any(Number),gears:2});
  expect.soft(sculpture.belt).toBeGreaterThan(500);expect.soft(sculpture.machine).toBeGreaterThan(100);
  const mechanismLeft=await page.evaluate(async()=>{const {Vector3}=await import('/node_modules/three/build/three.module.js');const meshes=window.scenes.flatMap(s=>s.children).filter(m=>m.name==='conveyor:machine'||m.name.startsWith('conveyor:gear:'));return Math.min(...meshes.flatMap(m=>{m.computeBoundingBox();const b=m.boundingBox.clone().applyMatrix4(m.matrixWorld),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new Vector3(x,y,z).project(window.conveyorCamera).x);return points;}));});
  expect.soft(mechanismLeft,'The machine and both gears must stay inside the stage').toBeGreaterThan(-1);
  const rollerEdges=await page.evaluate(async()=>{const {Vector3}=await import('/node_modules/three/build/three.module.js');return window.scenes.flatMap(s=>s.children).filter(m=>m.name.startsWith('conveyor:roller:')).map(m=>new Vector3().setFromMatrixPosition(m.matrixWorld).project(window.conveyorCamera).x).sort((a,b)=>a-b);});
  expect(rollerEdges[0],'Left roller needs a visible margin').toBeGreaterThan(-.85);
  expect(rollerEdges[1],'Right roller needs a visible margin').toBeLessThan(.85);
  const rollerClearance=await page.evaluate(async()=>{const {Matrix4}=await import('/node_modules/three/build/three.module.js'),meshes=window.scenes.flatMap(s=>s.children),roller=meshes.find(m=>m.name==='conveyor:roller:0'),belt=meshes.find(m=>m.name==='conveyor:belt'),a=new Matrix4();roller.getMatrixAt(0,a);const voxel=roller.geometry.parameters.width*a.elements[0],centers=[];for(let i=0;i<roller.count;i+=10){roller.getMatrixAt(i,a);centers.push([a.elements[12],a.elements[13]]);}const gap=Math.hypot(centers[0][0]-centers[1][0],centers[0][1]-centers[1][1]);belt.computeBoundingBox();return {gap,voxel,beltStart:belt.boundingBox.min.x,rollerX:roller.position.x};});
  expect(rollerClearance.gap,'Roller voxels must not overlap as they turn').toBeGreaterThan(rollerClearance.voxel);
  expect(rollerClearance.beltStart-rollerClearance.rollerX,'The belt must clear the roller face').toBeGreaterThan(.28);
  const rollerAngle=()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.name==='conveyor:roller:0')?.rotation.z);
  const angleBefore=await rollerAngle();await page.waitForTimeout(300);
  expect(await rollerAngle(),'The voxel roller should keep a stable silhouette instead of flashing as it spins').toBe(angleBefore);
  const beltOffset=()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.name==='conveyor:belt')?.position.x);
  expect(await beltOffset(),'The left belt seam must stay stable').toBe(0);
  await page.waitForTimeout(240);
  expect(await beltOffset(),'The left belt seam must not jump on wrap').toBe(0);
  const rightmost=()=>page.evaluate(async()=>{const {Vector3}=await import('/node_modules/three/build/three.module.js');return Math.max(...window.scenes.flatMap(s=>s.children).filter(m=>m.name.startsWith('conveyor:logo:')&&m.visible).flatMap(m=>{const b=m.boundingBox.clone().applyMatrix4(m.matrixWorld);return [b.min.x,b.max.x].flatMap(x=>[b.min.y,b.max.y].flatMap(y=>[b.min.z,b.max.z].map(z=>new Vector3(x,y,z).project(window.conveyorCamera).x)));}));});
  expect(await rightmost(),'A model on the belt must fit inside the right edge').toBeLessThan(.99);
  await page.waitForTimeout(2000);
  expect(await rightmost(),'Falling models must clear the right edge before clipping').toBeLessThan(.99);
  const background=await section.evaluate(e=>getComputedStyle(e).backgroundColor);expect.soft(background).toBe('rgb(25, 28, 29)');
  for(const link of await section.locator('.conveyor-link').all()){await expect(link).toHaveAttribute('target','_blank');expect.soft((await link.innerText()).trim()).toBe('');}
  const name='GitHub',read=()=>page.evaluate(name=>{const m=window.scenes.flatMap(s=>s.children).find(m=>m.name===`conveyor:logo:${name}`),g=window.scenes.flatMap(s=>s.children).find(m=>m.name==='conveyor:gear:0');return {x:m?.position.x||0,y:m?.position.y||0,gear:g?.rotation.z||0};},name);
  const before=await read();await section.getByRole('link',{name,exact:true}).dispatchEvent('pointerenter');await page.waitForTimeout(350);const hover=await read();
  expect.soft(hover.x).toBeGreaterThan(before.x+.02);expect.soft(hover.y).toBeGreaterThan(before.y+.1);expect.soft(hover.gear).not.toBe(before.gear);
  await section.getByRole('link',{name,exact:true}).focus();const focused=await read();expect.soft(Math.abs(focused.x-hover.x)).toBeLessThan(.2);
  await page.route('https://github.com/letya999',route=>route.fulfill({body:'Profile'}));
  const popupPromise=page.waitForEvent('popup');await section.getByRole('link',{name,exact:true}).evaluate(e=>e.click());const popup=await popupPromise;await popup.waitForLoadState();expect(popup.url()).toBe('https://github.com/letya999');await popup.close();
  await page.setViewportSize({width:390,height:844});await section.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
  let mobileRight=-Infinity;for(let i=0;i<12;i++){await page.waitForTimeout(180);mobileRight=Math.max(mobileRight,await rightmost());}
  expect(mobileRight,'Mobile logos must leave before reaching the right crop').toBeLessThan(.99);
  const mobileOverlap=await page.evaluate(async()=>{const {Vector3}=await import('/node_modules/three/build/three.module.js');const boxes=window.scenes.flatMap(s=>s.children).filter(m=>m.name.startsWith('conveyor:logo:')&&m.visible&&m.position.y>-.8).map(m=>{const b=m.boundingBox.clone().applyMatrix4(m.matrixWorld);return [new Vector3(b.min.x,0,0).project(window.conveyorCamera).x,new Vector3(b.max.x,0,0).project(window.conveyorCamera).x];}).sort((a,b)=>a[0]-b[0]);return Math.max(0,...boxes.slice(1).map((b,i)=>boxes[i][1]-b[0]));});
  expect(mobileOverlap,'Mobile logos need separate space on the belt').toBeLessThan(.05);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(400);const still=await read();await page.waitForTimeout(150);expect(await read()).toEqual(still);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
