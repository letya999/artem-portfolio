import {test,expect} from '@playwright/test';

test('the sideways lid and nested doll have a readable full-width mobile stage above the job text',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);if(typeof detail.render==='function'){const render=detail.render;window.renderer=detail;detail.render=function(scene,camera){window.camera=camera;return render.call(this,scene,camera);};}});});
  await page.goto('/');await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
  const layout=await page.evaluate(()=>{
    const row=document.querySelector('.career-entry'),slot=row.querySelector('.matryoshka-slot').getBoundingClientRect(),details=row.querySelector('details').getBoundingClientRect();
    return {stageWidth:slot.width,textWidth:details.width,above:slot.bottom<=details.top+1,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect.soft(layout.stageWidth,'A left-lying lid and an inner face cannot fit in a 90px column').toBeGreaterThan(280);
  expect.soft(layout.textWidth).toBeGreaterThan(300);
  expect.soft(layout.above).toBe(true);
  expect.soft(layout.overflow).toBe(false);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const c=[...document.querySelectorAll('.matryoshka-slot')].slice(0,2).map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2;});scrollTo(0,(c[0]+c[1])/2-innerHeight*.45);});
  await page.waitForTimeout(350);
  const visible=await page.evaluate(async()=>{
    const {WebGLRenderTarget}=await import('/node_modules/three/build/three.module.js');
    const scene=window.scenes.find(s=>s.children.some(m=>m.userData.dollOpen)),dolls=scene.children.find(m=>m.userData.dollOpen),renderer=window.renderer,visibility=scene.children.map(m=>m.visible),target=new WebGLRenderTarget(195,422),previous=renderer.getRenderTarget(),camera=window.camera;
    const parts=dolls.geometry.attributes.dollPart,parent=parts.array.slice(0,dolls.count/6*2);
    try{for(let i=0;i<dolls.count/6;i++)parts.setX(i,5);parts.needsUpdate=true;scene.children.forEach(m=>m.visible=false);dolls.visible=true;renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(195*422*4);renderer.readRenderTargetPixels(target,0,0,195,422,p);return p.subarray(195*84*4,195*338*4).filter((v,i)=>i%4===3&&v>128).length;}
    finally{parts.array.set(parent);parts.needsUpdate=true;scene.children.forEach((m,i)=>m.visible=visibility[i]);renderer.setRenderTarget(previous);target.dispose();renderer.render(scene,camera);}
  });
  expect.soft(visible,'The flying child must remain in the middle of the viewport halfway between tall mobile job sections').toBeGreaterThan(50);
  const textAboveParticles=await page.evaluate(()=>parseInt(getComputedStyle(document.querySelector('.career-entry details')).zIndex,10)>parseInt(getComputedStyle(document.querySelector('.portrait-stage canvas')).zIndex,10));
  expect.soft(textAboveParticles,'Mobile job cards must remain readable above the passing particle layer').toBe(true);
});
