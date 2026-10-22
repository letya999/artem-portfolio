import {test,expect} from '@playwright/test';

test('each vocabulary is surrounded by rotating cubic spiral arms',async({page})=>{
 await page.goto('/ru.html#practice');
 await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const canvas=page.locator('.practice-canvas');
 await expect(canvas).toHaveAttribute('data-galaxy-count','4');
 expect(Number(await canvas.getAttribute('data-particle-count'))).toBeGreaterThan(1000);
 const form=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender;let result;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&!result){const point=new THREE.Vector3(),matrix=new THREE.Matrix4(),xs=[],ys=[];for(let i=0;i<this.count;i++){this.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);xs.push(point.x);ys.push(point.y);}const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2,rx=(Math.max(...xs)-Math.min(...xs))/2,ry=(Math.max(...ys)-Math.min(...ys))/2,bins=Array.from({length:5},()=>[0,0,0]);for(let i=0;i<xs.length;i++){const x=(xs[i]-cx)/rx,y=(ys[i]-cy)/ry,r=Math.hypot(x,y);if(r<.35||r>.9)continue;const a=2*Math.atan2(y,x),bin=bins[Math.min(4,Math.floor((r-.35)/.11))];bin[0]+=Math.cos(a);bin[1]+=Math.sin(a);bin[2]++;}result={ratio:ry/rx,twoArmScore:bins.reduce((sum,[real,imag,n])=>sum+Math.hypot(real,imag)/n,0)/bins.length};}old.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(result){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return result;
 });
 expect(form.ratio).toBeLessThan(.5);expect(form.twoArmScore).toBeGreaterThan(.45);
 const before=await canvas.getAttribute('data-orbit-time');
 await page.waitForTimeout(350);
 expect(await canvas.getAttribute('data-orbit-time')).not.toBe(before);
});

test('four galaxies have distinct speeds, deeper cubes, and taller elliptical discs',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const result=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const original=THREE.InstancedMesh.prototype.onBeforeRender,items=[];
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&items.length<4){const m=new THREE.Matrix4(),v=new THREE.Vector3(),zs=[],ys=[];for(let i=0;i<this.count;i++){this.getMatrixAt(i,m);v.setFromMatrixPosition(m);zs.push(v.z);ys.push(v.y);}items.push({speed:this.userData.spinRate,depth:Math.max(...zs)-Math.min(...zs),height:Math.max(...ys)-Math.min(...ys)});}original.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(items.length>=4){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=original;return items;
 });
 expect(new Set(result.map(x=>x.speed)).size).toBe(4);
 expect(Math.min(...result.map(x=>x.depth))).toBeGreaterThan(35);
 expect(Math.min(...result.map(x=>x.height))).toBeGreaterThan(80);
});

test('cubic spiral arms breathe independently while rotating',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const canvas=page.locator('.practice-canvas'),before=await canvas.getAttribute('data-orbit-time');await expect.poll(()=>canvas.getAttribute('data-orbit-time')).not.toBe(before);
 const sample=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const radii=[];
  const old=THREE.InstancedMesh.prototype.onBeforeRender;let first;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'){if(!first)first=this;if(first===this){const root=document.querySelector('#practice').getBoundingClientRect(),group=document.querySelector('.voxel-tags').getBoundingClientRect();const cx=group.left-root.left+group.width/2-root.width/2,cy=root.height/2-(group.top-root.top+group.height/2);const m=new THREE.Matrix4(),v=new THREE.Vector3();this.getMatrixAt(150,m);v.setFromMatrixPosition(m);radii.push(Math.hypot((v.x-cx)/(group.width*.43),(v.y-cy)/(group.height*.30)));}}old.apply(this,args);};
  await new Promise(resolve=>setTimeout(resolve,200));radii.length=0;await new Promise(resolve=>setTimeout(resolve,650));THREE.InstancedMesh.prototype.onBeforeRender=old;return Math.max(...radii)-Math.min(...radii);
 });
 expect(sample).toBeGreaterThan(.004);
 expect(Number(await page.locator('.practice-canvas').getAttribute('data-particle-count'))).toBeGreaterThan(3200);
});

test('spiral cubes are visible at normal screen size',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const result=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender;let result;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&!result){const m=new THREE.Matrix4(),s=new THREE.Vector3(),p=new THREE.Vector3(),q=new THREE.Quaternion();this.getMatrixAt(0,m);m.decompose(p,q,s);result={size:s.x,color:this.material.color.getHex()};}old.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(result){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return result;
 });
 expect(result.size).toBeGreaterThan(2);
 expect(result.color).toBeLessThan(0x556055);
});

test('each spiral has a small animated radial fluctuation',async({page})=>{
 await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const amplitudes=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender,values=[];
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&values.length<4)values.push(this.userData.radialWobble);old.apply(this,args);};
  await new Promise(resolve=>{const poll=setInterval(()=>{if(values.length>=4){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return values;
 });
 expect(amplitudes).toHaveLength(4);expect(amplitudes.every(value=>value>0&&value<.05)).toBe(true);
});

test('the elliptical spiral fills the height of its card',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/ru.html#practice');await page.locator('.voxel-tags').first().scrollIntoViewIfNeeded();await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const height=await page.evaluate(async()=>{const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]),old=THREE.InstancedMesh.prototype.onBeforeRender;let height=0;THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&!height){const m=new THREE.Matrix4(),ys=[];for(let i=0;i<this.count;i++){this.getMatrixAt(i,m);ys.push(m.elements[13]);}height=Math.max(...ys)-Math.min(...ys);}old.apply(this,args);};await new Promise(resolve=>{const poll=setInterval(()=>{if(height){clearInterval(poll);resolve();}},25);setTimeout(()=>{clearInterval(poll);resolve();},3000);});THREE.InstancedMesh.prototype.onBeforeRender=old;return height;});
 expect(height).toBeGreaterThan(170);
});
