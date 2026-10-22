import {test,expect} from '@playwright/test';

test('voxel words orbit at several depths and heights',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto('/ru.html',{waitUntil:'domcontentloaded'});await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 await expect.poll(()=>page.locator('.practice-canvas').getAttribute('data-orbit-time')).not.toBeNull();
 const sample=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text();const THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const seen=new Map(),prior=THREE.InstancedMesh.prototype.onBeforeRender;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))seen.set(this.name,{x:this.position.x,y:this.position.y*.94+this.position.z*.34,z:this.position.z,width:this.userData.size.x*this.scale.x,height:this.userData.size.y*this.scale.y,opacity:this.material.opacity});prior.apply(this,args);};
  try{await new Promise(resolve=>{const poll=setInterval(()=>{if(seen.size>=55){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});}finally{THREE.InstancedMesh.prototype.onBeforeRender=prior;}
  const first=[...document.querySelectorAll('.voxel-tags')][0];const group=[...first.children].map(el=>seen.get(`practice:word:${el.dataset.voxelWord}`)).filter(Boolean);
  const overlaps=group.flatMap((a,i)=>group.slice(i+1).filter(b=>Math.abs(a.x-b.x)<(a.width+b.width)/2&&Math.abs(a.y-b.y)<(a.height+b.height)/2)).length;
  return {overlaps,visible:seen.size,width:first.clientWidth,wordWidth:Math.max(...group.map(v=>v.width)),depth:Math.max(...group.map(v=>v.z))-Math.min(...group.map(v=>v.z)),spread:Math.max(...group.map(v=>v.x))-Math.min(...group.map(v=>v.x)),vertical:Math.max(...group.map(v=>v.y))-Math.min(...group.map(v=>v.y))};
 });
 expect.soft(sample.visible).toBeGreaterThanOrEqual(55);expect.soft(sample.spread).toBeGreaterThan(sample.width*.3);expect.soft(sample.depth).toBeGreaterThan(90);
 expect.soft(sample.wordWidth).toBeLessThan(sample.width*.55);expect.soft(sample.vertical).toBeGreaterThan(sample.width*.4);
 expect.soft(sample.overlaps,'orbit labels must remain readable').toBe(0);
 const canvas=page.locator('.practice-canvas'),before=await canvas.getAttribute('data-orbit-time');await page.waitForTimeout(300);expect(await canvas.getAttribute('data-orbit-time')).not.toBe(before);
});

test('galaxies vary their rotation and enlarge the nearest word on hover',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const result=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const before=THREE.InstancedMesh.prototype.onBeforeRender,samples=[];
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))samples.push({name:this.name,scale:this.scale.x,x:this.position.x,y:this.position.y});before.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(samples.length>=55){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});const first=samples.find(v=>v.name==='practice:word:Backlog')||samples[0];samples.length=0;
  const canvas=document.querySelector('.practice-canvas'),r=canvas.getBoundingClientRect();document.elementFromPoint(r.left+r.width/2+first.x,r.top+r.height/2-first.y)?.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+r.width/2+first.x,clientY:r.top+r.height/2-first.y}));
  await new Promise(resolve=>setTimeout(resolve,180));THREE.InstancedMesh.prototype.onBeforeRender=before;
  const hovered=samples.find(v=>v.name===first.name);return {before:first.scale,after:hovered?.scale};
 });
 expect(result.after).toBeGreaterThan(result.before*1.15);
});

test('galaxy lettering is large and built from deep voxel layers',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const result=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender;let maxScale=0,depth=0;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:')){maxScale=Math.max(maxScale,this.scale.x);const m=new THREE.Matrix4(),zs=[];for(let i=0;i<Math.min(this.count,20);i++){this.getMatrixAt(i,m);zs.push(m.elements[14]);}depth=Math.max(depth,Math.max(...zs)-Math.min(...zs));}old.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(maxScale){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return {maxScale,depth};
 });
 expect(result.maxScale).toBeGreaterThan(1.2);expect(result.depth).toBeGreaterThan(3);
});

test('words fill the tall disc and stay large at desktop width',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const result=await page.evaluate(async()=>{const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]),old=THREE.InstancedMesh.prototype.onBeforeRender;const words=new Map();THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))words.set(this.name,{y:this.position.y,scale:this.scale.x});old.apply(this,args);};await new Promise(resolve=>{const poll=setInterval(()=>{if(words.size>=55){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;const group=[...document.querySelector('.voxel-tags').children].map(el=>words.get(`practice:word:${el.dataset.voxelWord}`)).filter(Boolean);return {spread:Math.max(...group.map(x=>x.y))-Math.min(...group.map(x=>x.y)),scale:Math.max(...group.map(x=>x.scale))};});
 expect(result.spread).toBeGreaterThan(210);expect(result.scale).toBeGreaterThan(1.65);
});

test('large words stay readable in all three spinning galaxies',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const overlaps=await page.evaluate(async()=>{const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]),old=THREE.InstancedMesh.prototype.onBeforeRender;const seen=new Map();THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))seen.set(this.name,{x:this.position.x,y:this.position.y*.94+this.position.z*.34,w:this.userData.size.x*this.scale.x,h:this.userData.size.y*this.scale.y});old.apply(this,args);};await new Promise(resolve=>{const poll=setInterval(()=>{if(seen.size>=55){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return [...document.querySelectorAll('.voxel-tags')].map(group=>{const words=[...group.children].map(el=>seen.get(`practice:word:${el.dataset.voxelWord}`)).filter(Boolean);return words.flatMap((a,i)=>words.slice(i+1).filter(b=>Math.abs(a.x-b.x)<(a.w+b.w)/2+4&&Math.abs(a.y-b.y)<(a.h+b.h)/2+4)).length;});});
 expect(overlaps).toEqual([0,0,0]);
});

test('voxel words turn in depth to show their side faces',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const tilt=await page.evaluate(async()=>{const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]),old=THREE.InstancedMesh.prototype.onBeforeRender;let tilt=0;THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))tilt=Math.max(tilt,Math.abs(this.rotation.y));old.apply(this,args);};await new Promise(resolve=>{const poll=setInterval(()=>{if(tilt){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return tilt;});
 expect(tilt).toBeGreaterThan(.1);
});


test('mobile galaxy labels remain inside their column',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/ru.html#practice');
 await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const outside=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender,seen=new Map();
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))seen.set(this.name,{x:this.position.x,w:this.userData.size.x*this.scale.x});old.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(seen.size>=55){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});
  THREE.InstancedMesh.prototype.onBeforeRender=old;
  const root=document.querySelector('#practice').getBoundingClientRect(),group=document.querySelector('.voxel-tags').getBoundingClientRect(),cx=group.left-root.left+group.width/2-root.width/2;
  return [...document.querySelector('.voxel-tags').children].filter(el=>{const word=seen.get(`practice:word:${el.dataset.voxelWord}`);return word&&Math.abs(word.x-cx)+word.w/2>group.width/2+2;}).length;
 });
 expect(outside).toBe(0);
});
