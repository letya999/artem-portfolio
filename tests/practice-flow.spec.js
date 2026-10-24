import {test,expect} from '@playwright/test';

test('practice visualizes three streams compressed by voxel hands into a product',async({page})=>{
  await page.goto('/#practice');
  const section=page.locator('#practice');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.practice-row')).toHaveCount(3);
  await expect(section.locator('.practice-stream')).toHaveCount(3);
  await expect(section.locator('[data-press-anchor]')).toBeVisible();
  await expect(section.locator('[data-outcome-anchor]')).toBeVisible();
  const canvas=section.locator('canvas[data-hand-voxels]');
  await expect(canvas).toBeVisible();
  const before=await canvas.getAttribute('data-cycle-time');
  await expect.poll(()=>canvas.getAttribute('data-cycle-time'),{timeout:12000}).not.toBe(before);
  await page.waitForFunction(()=>document.querySelector('.practice-canvas')?.dataset.pressPhase==='hold');
  await expect(canvas).toHaveAttribute('data-accumulated','64');
  await expect(canvas).toHaveAttribute('data-delivery-progress','0.000');
  await page.waitForFunction(()=>document.querySelector('.practice-canvas')?.dataset.pressPhase==='settled');
  await expect(canvas).toHaveAttribute('data-delivery-progress','1.000');
});

test('reduced motion shows a completed product without running the press',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/ru.html#practice');
  await page.locator('.practice-press').scrollIntoViewIfNeeded();
  const canvas=page.locator('.practice-canvas');
  await expect(canvas).toHaveAttribute('data-press-phase','settled');
  await expect(canvas).toHaveAttribute('data-product-visible','true');
  const phase=await canvas.getAttribute('data-cycle-time');
  await page.waitForTimeout(300);
  await expect(canvas).toHaveAttribute('data-cycle-time',phase);
});

test('delivered product travels right and its shadow clears before the next build',async({page})=>{
  test.setTimeout(45000);
  await page.addInitScript(()=>{window.scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',({detail})=>{if(detail.isScene)window.scenes.push(detail);});});
  await page.goto('/ru.html#practice');
  await page.locator('.practice-press').scrollIntoViewIfNeeded();
  const canvas=page.locator('.practice-canvas');
  await expect(canvas).toHaveAttribute('data-press-phase','settled',{timeout:32000});
  const settledX=await page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.name==='practice:delivered-product')?.position.x);
  await expect(canvas).toHaveAttribute('data-press-phase','exit',{timeout:5000});
  await page.waitForTimeout(100);
  const exitingX=await page.evaluate(()=>window.scenes.flatMap(s=>s.children).find(m=>m.name==='practice:delivered-product')?.position.x);
  expect(exitingX).toBeGreaterThan(settledX+10);
  const shadow=await page.evaluate(()=>{const m=window.scenes.find(s=>s.children.some(c=>c.name==='practice:lower'))?.children.filter(c=>c.geometry?.type==='PlaneGeometry').at(-1);return {x:m.position.x,opacity:m.material.opacity};});
  expect(shadow.x).toBeGreaterThan(settledX+10);
  expect(shadow.opacity).toBeLessThan(.9);
  await expect(canvas).toHaveAttribute('data-press-phase','collect',{timeout:5000});
  await expect(canvas).toHaveAttribute('data-product-visible','false');
  await expect.poll(()=>page.locator('.practice-tag[data-active]').first().getAttribute('data-motion'),{timeout:700}).toBe('word');
  const resultShadowOpacity=await page.evaluate(()=>window.scenes.find(s=>s.children.some(m=>m.name==='practice:lower'))?.children.filter(m=>m.geometry?.type==='PlaneGeometry').at(-1)?.material.opacity);
  expect(resultShadowOpacity).toBe(0);
});
