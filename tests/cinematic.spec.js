import {test, expect} from '@playwright/test';

test('the whole bust dissolves into a deep perspective equation, which enters opening career dolls', async ({page}) => {
  const check = expect.configure({soft: true, timeout: 2000});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 1440, height: 900});
  await page.addInitScript(() => {
    window.portraitScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', ({detail}) => {
      if (detail.isScene) window.portraitScenes.push(detail);
      if (typeof detail.render === 'function') {
        const original = detail.render;
        detail.render = function(scene, camera) { window.portraitCamera = camera; return original.call(this, scene, camera); };
      }
    });
  });
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  const state = () => page.evaluate(async () => {
    const {Box3,Vector3,Matrix4}=await import('/node_modules/three/build/three.module.js');
    const objects = window.portraitScenes.flatMap(s => s.children);
    const head = objects.find(m => m.userData.cubeCount);
    const law = objects.find(m => m.geometry?.attributes.equationTarget);
    const dolls = objects.find(m => m.userData.dollOpen);
    const a = law.geometry.attributes.equationTarget;
    let front = -Infinity, back = Infinity, left = Infinity, right = -Infinity;
    for (let i = 0; i < a.count; i++) { front = Math.max(front, a.getZ(i)); back = Math.min(back, a.getZ(i)); left = Math.min(left, a.getX(i)); right = Math.max(right, a.getX(i)); }
    const units=4.1/document.querySelector('.portrait-stage canvas').getBoundingClientRect().height;
    const bowl=new Box3(),matrix=new Matrix4(),point=new Vector3();
    if(dolls){dolls.updateMatrixWorld();for(let i=0;i<dolls.count/6;i++)if(dolls.geometry.attributes.dollPart.getY(i)===0){dolls.getMatrixAt(i,matrix);bowl.expandByPoint(point.setFromMatrixPosition(matrix).applyMatrix4(dolls.matrixWorld));}}
    return {absorbedInside:!!law.userData.absorption && bowl.containsPoint(law.userData.absorption.value),widthRatio:(right-left)/(document.querySelector('.equation-slot').getBoundingClientRect().width*units),dissolve: head.userData.dissolve?.value ?? 0, neckFillVisible: head.userData.neckFill.visible, lawVisible: law.visible, depth: (front-back)/(right-left), yaw: law.rotation.y, pitch: law.rotation.x, perspective: !!window.portraitCamera.isPerspectiveCamera, flow: law.userData.experienceProgress.value, openings: dolls ? [...dolls.userData.dollOpen.value] : [], dollCount: dolls?.count ?? 0, active: dolls?.userData.active ?? -1};
  });
  await page.evaluate(() => {document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#results').offsetTop - innerHeight * .55);});
  await check.poll(async () => (await state()).dissolve, {message:'The remaining head and neck must also disintegrate'}).toBeGreaterThan(.2);
  check((await state()).neckFillVisible,'The neck cavity must not show an inner plug during disintegration').toBe(false);
  await page.evaluate(() => scrollTo(0, document.querySelector('#results').offsetTop));
  await check.poll(async () => (await state()).dissolve).toBe(1);
  const law = await state();
  check(law.perspective, 'Use a real perspective camera for the sculpture').toBe(true);
  check(law.depth, 'Letter extrusion must be clearly visible').toBeGreaterThan(.06);
  check(law.widthRatio, 'The law sculpture must be visibly larger than the previous version').toBeGreaterThan(1.05);
  check(Math.abs(law.yaw)).toBeGreaterThan(.25);
  check(Math.abs(law.pitch)).toBeGreaterThan(.06);
  await page.evaluate(() => scrollTo(0, document.querySelector('#experience').offsetTop));
  await check.poll(async () => (await state()).flow).toBe(1);
  await check.poll(async () => (await state()).openings[0] ?? 0).toBeGreaterThan(.95);
  check((await state()).dollCount, 'Six complete voxel shells need enough cubes for faces, scarves and curved bowls').toBeGreaterThan(5000);
  check((await state()).lawVisible, 'The compressed equation should finish inside the first doll').toBe(false);
  check((await state()).absorbedInside, 'The final absorption point must lie inside the lower bowl, below its rim').toBe(true);
  await page.locator('#experience summary').first().click();
  await check.poll(async () => (await state()).openings[0] ?? 1).toBeLessThan(.02);
  await page.locator('#experience summary').first().click();
  await check.poll(async () => (await state()).openings[0] ?? 0).toBeGreaterThan(.95);
  await page.evaluate(() => {const r=document.querySelectorAll('.career-entry')[1].getBoundingClientRect(); scrollBy(0, r.top+r.height/2-innerHeight*.45);});
  await check.poll(async () => (await state()).active).toBe(1);
  await check.poll(async () => (await state()).openings[1] ?? 0).toBeGreaterThan(.95);
  await check.poll(async () => (await state()).openings[0] ?? 1).toBeLessThan(.02);
  await page.evaluate(() => scrollTo(0,0));
  await check.poll(async () => (await state()).dissolve).toBe(0);
  expect(errors).toEqual([]);
});
