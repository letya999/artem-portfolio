import {test,expect} from '@playwright/test';

test('the enlarged perspective equation stays completely inside its canvas and the screen at both cursor extremes',async({page})=>{
  const check=expect.configure({soft:true});
  await page.addInitScript(()=>{
    window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{
      if(detail.isScene)window.scenes.push(detail);
      if(typeof detail.render==='function'){const render=detail.render;detail.render=function(scene,camera){window.camera=camera;return render.call(this,scene,camera);};}
    });
  });
  await page.goto('/');await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/, {timeout:20000});
  for(const width of [1920,390]){
    await page.setViewportSize({width,height:width===390?844:1080});
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#results').offsetTop);});
    await expect(page.locator('.portrait-stage')).toHaveAttribute('data-equation-progress','1');
    for(const side of [0,1]){
      const r=await page.locator('.equation-slot').boundingBox();
      await page.mouse.move(r.x+r.width*side,r.y+r.height/2);await page.waitForTimeout(700);
      const bounds=await page.evaluate(async()=>{
        const {Vector3}=await import('/node_modules/three/build/three.module.js');
        const mesh=window.scenes.flatMap(s=>s.children).find(m=>m.geometry?.attributes.equationTarget),a=mesh.geometry.attributes.equationTarget;
        const c=document.querySelector('.portrait-stage canvas').getBoundingClientRect(),p=new Vector3();
        let left=Infinity,right=-Infinity;mesh.updateMatrixWorld();window.camera.updateMatrixWorld();
        for(let i=0;i<a.count;i++)for(const sign of [-1,1]){
          p.set(a.getX(i)+sign*a.getW(i)/2,a.getY(i),a.getZ(i)+sign*a.getW(i)/2).applyMatrix4(mesh.matrixWorld).project(window.camera);
          const x=c.left+(p.x+1)*c.width/2;left=Math.min(left,x);right=Math.max(right,x);
        }
        return {left,right,min:Math.max(12,c.left+1),max:Math.min(innerWidth-12,c.right-1)};
      });
      check(bounds.left,`${width}px left edge must remain visible`).toBeGreaterThanOrEqual(bounds.min);
      check(bounds.right,`${width}px Throughput must not be cut off`).toBeLessThanOrEqual(bounds.max);
    }
  }
});
