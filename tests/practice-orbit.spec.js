import {test,expect} from '@playwright/test';
test('three orbiting vocabularies and structured evidence include projects and relevant education',async({page})=>{
 await page.goto('/#practice');await page.locator('#practice').scrollIntoViewIfNeeded();
 for(const cloud of await page.locator('.voxel-tags').all())expect.soft(await cloud.locator('[data-voxel-word]').count()).toBeGreaterThanOrEqual(16);
 for(const word of ['Гант','ИСР','Rust','React','P&L','CJM'])expect.soft(await page.locator('#practice').textContent()).toContain(word);
 for(let i=0;i<3;i++){
  await page.locator('.practice-more').nth(i).click();const dialog=page.locator('#practice .practice-dialog');
  expect.soft(await dialog.locator('.dialog-detail').count()).toBeGreaterThanOrEqual(4);
  expect.soft(await dialog.innerText()).toContain('СПбПУ');expect.soft(await dialog.innerText()).toMatch(/SAFe|PSM|ICAgile|Kanban/);
  await page.keyboard.press('Escape');
 }
 const motion=await page.locator('.practice-canvas').getAttribute('data-orbit-time');await page.waitForTimeout(400);expect.soft(await page.locator('.practice-canvas').getAttribute('data-orbit-time')).not.toBe(motion);
});
