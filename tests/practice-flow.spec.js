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
  const phase=await canvas.getAttribute('data-cycle-time');
  await page.waitForTimeout(300);
  await expect(canvas).toHaveAttribute('data-cycle-time',phase);
});
