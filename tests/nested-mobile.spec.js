import {test,expect} from '@playwright/test';
test('mobile sculptures sit beside summaries while expanded text keeps the full width',async({page})=>{
 await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);if(typeof detail.render==='function'){const render=detail.render;window.renderer=detail;detail.render=function(scene,camera){window.camera=camera;return render.call(this,scene,camera);};}});});
 await page.setViewportSize({width:390,height:844});await page.goto('/ru');
 await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
 const row=page.locator('.career-entry').first();await row.locator('summary').click();
 const layout=await row.evaluate(e=>{const slot=e.querySelector('.matryoshka-slot').getBoundingClientRect(),summary=e.querySelector('summary').getBoundingClientRect(),text=e.querySelector('.job-content').getBoundingClientRect();return {slotRight:slot.right,companyLeft:e.querySelector('.company').getBoundingClientRect().left,slotTop:slot.top,summaryBottom:summary.bottom,textWidth:text.width};});
 expect(layout.slotRight).toBeLessThan(layout.companyLeft);expect(layout.slotTop).toBeLessThan(layout.summaryBottom);expect(layout.textWidth).toBeGreaterThan(300);
 const screenshot=await row.locator('.matryoshka-slot').screenshot();
 const dark=await page.evaluate(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=4)if(p[i]<150&&p[i+1]<150&&p[i+2]<150)n++;resolve(n);};img.src=src;}),'data:image/png;base64,'+screenshot.toString('base64'));
 expect(dark,'The page must show the doll, not cover it with the job card background').toBeGreaterThan(200);
 await row.locator('summary').click();
 const positions=await page.evaluate(()=>[...document.querySelectorAll('.matryoshka-slot')].slice(0,2).map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2-innerHeight*.45;}));
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),(positions[0]+positions[1])/2);
 await expect.poll(()=>page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.userData.dollOpen)?.userData.stage.value)).toBeCloseTo(.5,1);
 const pixels=await page.evaluate(async()=>{
  const {WebGLRenderTarget}=await import('/node_modules/three/build/three.module.js');
  const scene=window.scenes.find(s=>s.children.some(m=>m.userData.dollOpen)),dolls=scene.children.find(m=>m.userData.dollOpen),renderer=window.renderer,target=new WebGLRenderTarget(195,422),previous=renderer.getRenderTarget(),visibility=scene.children.map(m=>m.visible),part=dolls.geometry.attributes.dollPart,saved=part.array.slice();
  try{
   // Keep only group 1, the flying nested child, in the actual GPU draw.
   for(let i=0;i<part.count;i++)if(part.getX(i)!==1)part.setX(i,5);part.needsUpdate=true;
   scene.children.forEach(m=>m.visible=false);dolls.visible=true;renderer.setRenderTarget(target);renderer.render(scene,window.camera);
   const data=new Uint8Array(98*422*4);renderer.readRenderTargetPixels(target,0,0,98,422,data);return data.filter((v,i)=>i%4===3&&v>128).length;
  }finally{part.array.set(saved);part.needsUpdate=true;scene.children.forEach((m,i)=>m.visible=visibility[i]);renderer.setRenderTarget(previous);target.dispose();renderer.render(scene,window.camera);}
 });
 expect(pixels,'The nested child must actually render in the left half of the mobile screen').toBeGreaterThan(30);
});
