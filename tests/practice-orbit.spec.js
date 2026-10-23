import {test,expect} from '@playwright/test';

test('three cube streams keep detailed vocabulary in their dialogs',async({page})=>{
 await page.goto('/#practice');
 const section=page.locator('#practice');
 await section.scrollIntoViewIfNeeded();
 const streams=section.locator('.practice-stream');
 await expect(streams).toHaveCount(3);
 await expect(section.locator('.practice-tag')).toHaveCount(192);
 for(const [i,term] of ['MVP','Rust','SAFe'].entries()){
  await section.locator('.practice-more').nth(i).click();
  const dialog=section.locator('.practice-dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.locator('.dialog-detail').count()).toBeGreaterThanOrEqual(4);
  await expect(dialog.locator('.practice-vocabulary')).toContainText(term);
  await page.keyboard.press('Escape');
 }
 const canvas=section.locator('.practice-canvas');
 const before=await canvas.getAttribute('data-cycle-time');
 await expect.poll(()=>canvas.getAttribute('data-cycle-time'),{timeout:12000}).not.toBe(before);
});
