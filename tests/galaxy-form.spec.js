import {test,expect} from '@playwright/test';

test('each vocabulary is surrounded by rotating cubic spiral arms',async({page})=>{
 await page.goto('/ru.html#practice');
 await page.locator('#practice').scrollIntoViewIfNeeded();
 await expect(page.locator('#practice')).toHaveClass(/practice-ready/);
 const canvas=page.locator('.practice-canvas');
 await expect(canvas).toHaveAttribute('data-galaxy-count','4');
 expect(Number(await canvas.getAttribute('data-particle-count'))).toBeGreaterThan(1000);
 const form=await page.evaluate(async()=>{
  const source=await(await fetch('/src/practice-scene.js')).text(),THREE=await import(source.match(/from "([^"]+)"/)[1]);
  const old=THREE.InstancedMesh.prototype.onBeforeRender;let result;
  THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='practice:galaxy'&&!result){const point=new THREE.Vector3(),matrix=new THREE.Matrix4(),xs=[],ys=[];for(let i=0;i<this.count;i++){this.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);xs.push(point.x);ys.push(point.y);}const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2,rx=(Math.max(...xs)-Math.min(...xs))/2,ry=(Math.max(...ys)-Math.min(...ys))/2,bins=Array.from({length:5},()=>[0,0,0]);for(let i=0;i<xs.length;i++){const x=(xs[i]-cx)/rx,y=(ys[i]-cy)/ry,r=Math.hypot(x,y);if(r<.35||r>.9)continue;const a=2*Math.atan2(y,x),bin=bins[Math.min(4,Math.floor((r-.35)/.11))];bin[0]+=Math.cos(a);bin[1]+=Math.sin(a);bin[2]++;}result={ratio:ry/rx,twoArmScore:bins.reduce((sum,[real,imag,n])=>sum+Math.hypot(real,imag)/n,0)/bins.length};}old.apply(this,args);};
  await new Promise(resolve=>setTimeout(resolve,150));THREE.InstancedMesh.prototype.onBeforeRender=old;return result;
 });
 expect(form.ratio).toBeLessThan(.5);expect(form.twoArmScore).toBeGreaterThan(.45);
 const before=await canvas.getAttribute('data-orbit-time');
 await page.waitForTimeout(350);
 expect(await canvas.getAttribute('data-orbit-time')).not.toBe(before);
});
