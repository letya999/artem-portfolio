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
  await expect.poll(()=>canvas.getAttribute('data-cycle-time')).not.toBe(before);
});
