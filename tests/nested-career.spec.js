import {test,expect} from '@playwright/test';

test('the first bowl receives scattered letters; its lid rests to the left and its nested child travels reversibly to the next job',async({page})=>{
  const check=expect.configure({soft:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});
  await page.addInitScript(()=>{
    window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{
      if(detail.isScene)window.scenes.push(detail);
      if(typeof detail.render==='function'){const render=detail.render;window.renderer=detail;detail.render=function(scene,camera){window.camera=camera;return render.call(this,scene,camera);};}
    });
  });
  await page.goto('/');await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#experience').offsetTop-innerHeight*.5);});
  await page.waitForTimeout(350);
  const arrival=await page.evaluate(async()=>{
    const {Vector3}=await import('/node_modules/three/build/three.module.js');
    const law=window.scenes.flatMap(s=>s.children).find(m=>m.userData.absorption),c=document.querySelector('.portrait-stage canvas').getBoundingClientRect();
    law.updateMatrixWorld();window.camera.updateMatrixWorld();
    const p=new Vector3().copy(law.userData.absorption.value).applyMatrix4(law.matrixWorld).project(window.camera);
    return {y:c.top+(1-p.y)*c.height/2,bottom:Math.min(innerHeight-24,c.bottom-1)};
  });
  check(arrival.y,'The first bowl must be visible in the viewport while it receives the letter cubes').toBeLessThan(arrival.bottom);
  const textOverlap=await page.evaluate(async()=>{
    const {WebGLRenderTarget}=await import('/node_modules/three/build/three.module.js');
    const scene=window.scenes.find(s=>s.children.some(m=>m.userData.dollOpen)),dolls=scene.children.find(m=>m.userData.dollOpen),renderer=window.renderer,camera=window.camera,previous=renderer.getRenderTarget(),visibility=scene.children.map(m=>m.visible);
    const c=document.querySelector('.portrait-stage canvas').getBoundingClientRect(),r=document.querySelector('#experience .section-top>p').getBoundingClientRect();
    const x=Math.max(0,Math.floor((r.left-c.left)/c.width*400)),right=Math.min(400,Math.ceil((r.right-c.left)/c.width*400));
    const y=Math.max(0,Math.floor((c.bottom-r.bottom)/c.height*240)),top=Math.min(240,Math.ceil((c.bottom-r.top)/c.height*240));
    if(right<=x||top<=y)return 0;
    const target=new WebGLRenderTarget(400,240);
    try{scene.children.forEach(m=>m.visible=false);dolls.visible=true;renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array((right-x)*(top-y)*4);renderer.readRenderTargetPixels(target,x,y,right-x,top-y,p);return p.filter((v,i)=>i%4===3&&v>128).length;}
    finally{scene.children.forEach((m,i)=>m.visible=visibility[i]);renderer.setRenderTarget(previous);target.dispose();renderer.render(scene,camera);}
  });
  check(textOverlap,'The arriving first doll must not obscure the experience introduction').toBe(0);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#experience').offsetTop);});
  await expect(page.locator('.portrait-stage')).toHaveAttribute('data-equation-progress','1');
  await page.waitForTimeout(900);
  const rendered=await page.evaluate(async()=>{
    const {WebGLRenderTarget,Vector3}=await import('/node_modules/three/build/three.module.js');
    const scene=window.scenes.find(s=>s.children.some(m=>m.userData.dollOpen)),dolls=scene.children.find(m=>m.userData.dollOpen),law=scene.children.find(m=>m.userData.absorption);
    const renderer=window.renderer,camera=window.camera,probe=camera.clone(),target=new WebGLRenderTarget(256,256),previous=renderer.getRenderTarget();
    const visibility=scene.children.map(m=>m.visible),count=dolls.count;
    const saved={flow:law.userData.experienceProgress.value,progress:law.userData.progress.value,point:law.userData.absorption.value.clone(),rotation:law.rotation.clone(),spread:law.userData.absorptionSpread?.value};
    const pixels=()=>{renderer.render(scene,probe);const p=new Uint8Array(256*256*4);renderer.readRenderTargetPixels(target,0,0,256,256,p);return p;};
    try{
      renderer.setRenderTarget(target);scene.children.forEach(m=>m.visible=false);dolls.visible=true;dolls.count=count/6;
      const row=dolls.userData.rows[0];probe.aspect=1;probe.position.set(row.x,row.y-.075+dolls.position.y,7.15);probe.updateProjectionMatrix();
      const p=pixels();let left=256,right=0,top=256,bottom=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(p[(y*256+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      dolls.count=count;const last=dolls.userData.rows[5];probe.position.set(last.x,last.y-.075+dolls.position.y,7.15);
      const hidden=pixels().filter((v,i)=>i%4===3&&v>128).length;
      dolls.visible=false;law.visible=true;law.rotation.set(0,0,0);law.userData.progress.value=1;law.userData.experienceProgress.value=.5;law.userData.absorption.value.set(0,-.7,0);probe.position.set(0,0,7.15);
      let scattered=0;
      if(law.userData.absorptionSpread){law.userData.absorptionSpread.value=0;const a=pixels();law.userData.absorptionSpread.value=.8;const b=pixels();scattered=b.reduce((n,v,i)=>n+(i%4===3&&v!==a[i]?1:0),0);}
      return {leftReach:128-left,rightReach:right-128,lidAspect:(right-left)/(bottom-top),hidden,scattered,innerScale:dolls.userData.innerScale?.value??0};
    }finally{
      dolls.count=count;law.userData.progress.value=saved.progress;law.userData.experienceProgress.value=saved.flow;law.userData.absorption.value.copy(saved.point);law.rotation.copy(saved.rotation);
      if(law.userData.absorptionSpread)law.userData.absorptionSpread.value=saved.spread;
      scene.children.forEach((m,i)=>m.visible=visibility[i]);renderer.setRenderTarget(previous);target.dispose();renderer.render(scene,camera);
    }
  });
  check(rendered.leftReach,'The detached cap must lie on the left of its bowl').toBeGreaterThan(rendered.rightReach*1.5);
  check(rendered.lidAspect,'The open lid must rest sideways, not float above the bowl').toBeGreaterThan(1);
  check(rendered.hidden,'Unfocused career dolls must remain hidden even when the camera looks directly at them').toBe(0);
  check(rendered.scattered,'Letter cubes must really scatter in the GPU before entering the first bowl').toBeGreaterThan(50);
  check(rendered.innerScale,'An open outer shell must contain a recognizable smaller doll').toBeGreaterThan(.4);
  check(rendered.innerScale).toBeLessThan(.85);
  const positions=await page.evaluate(()=>[...document.querySelectorAll('.matryoshka-slot')].slice(0,2).map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2-innerHeight*.45;}));
  const states=[];
  for(const y of [positions[0],(positions[0]+positions[1])/2,positions[1],(positions[0]+positions[1])/2,positions[0]]){
    await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(350);
    states.push(await page.evaluate(()=>{const m=window.scenes.flatMap(s=>s.children).find(m=>m.userData.dollOpen);return {stage:m.userData.stage?.value??0,spread:m.userData.transferSpread?.value??0};}));
  }
  check(states[1].stage,'A scroll between jobs must show a continuous cube flight, not an instantaneous focus switch').toBeGreaterThan(.2);
  check(states[1].stage).toBeLessThan(.8);
  check(states[2].stage).toBeCloseTo(1,2);
  check(states[1].spread,'The nested child must stay visually coherent during transfer').toBeLessThan(.2);
  check(states[3].stage,'Scrolling upward must reverse the exact same transfer').toBeCloseTo(states[1].stage,2);
  check(states[4].stage).toBeCloseTo(0,2);
  expect(errors).toEqual([]);
});
