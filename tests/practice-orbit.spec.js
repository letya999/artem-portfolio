import {test,expect} from '@playwright/test';

test('three flowing vocabularies retain detailed evidence',async({page})=>{
 await page.goto('/#practice');
 const section=page.locator('#practice');
 await section.scrollIntoViewIfNeeded();
 const streams=section.locator('.practice-stream');
 await expect(streams).toHaveCount(3);
 for(const stream of await streams.all())expect(await stream.locator('.practice-tag').count()).toBeGreaterThanOrEqual(16);
 for(const word of ['Гант','ИСР','Rust','React','P&L','CJM'])expect(await section.textContent()).toContain(word);
 for(let i=0;i<3;i++){
  await section.locator('.practice-more').nth(i).click();
  const dialog=section.locator('.practice-dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.locator('.dialog-detail').count()).toBeGreaterThanOrEqual(4);
  expect(await dialog.innerText()).toContain('СПбПУ');
  await page.keyboard.press('Escape');
 }
 const canvas=section.locator('.practice-canvas');
 const before=await canvas.getAttribute('data-cycle-time');
 await expect.poll(()=>canvas.getAttribute('data-cycle-time')).not.toBe(before);
});
