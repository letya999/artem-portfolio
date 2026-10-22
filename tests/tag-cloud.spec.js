import {test,expect} from '@playwright/test';

test('voxel words form flat rotating discs',async({page})=>{
 await page.goto('/ru.html',{waitUntil:'domcontentloaded'});await page.locator('#practice').scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const sample=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text();const THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const seen=new Map(),prior=THREE.InstancedMesh.prototype.onBeforeRender;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name.startsWith('practice:word:'))seen.set(this.name,{x:this.position.x,y:this.position.y,z:this.position.z,width:this.userData.size.x*this.scale.x,height:this.userData.size.y*this.scale.y,opacity:this.material.opacity});prior.apply(this,args);};
  try{await new Promise(resolve=>setTimeout(resolve,200));}finally{THREE.InstancedMesh.prototype.onBeforeRender=prior;}
  const first=[...document.querySelectorAll('.voxel-tags')][0];const group=[...first.children].map(el=>seen.get(`practice:word:${el.dataset.voxelWord}`)).filter(Boolean);
  const overlaps=group.flatMap((a,i)=>group.slice(i+1).filter(b=>Math.abs(a.x-b.x)<(a.width+b.width)/2&&Math.abs(a.y-b.y)<(a.height+b.height)/2)).length;
  return {overlaps,visible:seen.size,width:first.clientWidth,wordWidth:Math.max(...group.map(v=>v.width)),spread:Math.max(...group.map(v=>v.x))-Math.min(...group.map(v=>v.x)),vertical:Math.max(...group.map(v=>v.y))-Math.min(...group.map(v=>v.y))};
 });
 expect.soft(sample.visible).toBeGreaterThanOrEqual(64);expect.soft(sample.spread).toBeGreaterThan(sample.width*.3);
 expect.soft(sample.wordWidth).toBeLessThan(sample.width*.55);expect.soft(sample.vertical).toBeLessThan(sample.spread*.42);
 expect.soft(sample.overlaps,'orbit labels must remain readable').toBe(0);
 const canvas=page.locator('.practice-canvas'),before=await canvas.getAttribute('data-orbit-time');await page.waitForTimeout(300);expect(await canvas.getAttribute('data-orbit-time')).not.toBe(before);
});
