import {test,expect} from '@playwright/test';
test('peel sticker reveals an accessible making-of with real source imagery and an interactive scan',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.portrait-sticker')).toHaveCount(1);
 if(await page.locator('.portrait-sticker').count()){await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();}
 const story=page.locator('.story-dialog');
 await expect.soft(story).toBeVisible({timeout:200});
 expect.soft(await story.locator('figure').count()).toBeGreaterThanOrEqual(5);
 expect.soft(await story.locator('canvas').count()).toBe(1);
 let rendered=false,rotated=false,resized=false;
 if(await story.locator('canvas').count()){
  const scan=story.locator('canvas');await scan.scrollIntoViewIfNeeded();await page.waitForTimeout(600);
  const before=await scan.screenshot();rendered=new Set(before).size>100;const box=await scan.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:8});await page.mouse.up();rotated=!before.equals(await scan.screenshot());
  await page.setViewportSize({width:700,height:800});await page.waitForTimeout(150);resized=(await scan.boundingBox()).width!==box.width;
 }
 expect.soft(rendered,'scan geometry renders').toBe(true);expect.soft(rotated,'drag rotates measured scan').toBe(true);expect.soft(resized,'scan fits resized dialog').toBe(true);
 expect.soft(await story.count()?await story.innerText():'').toContain('MediaPipe');
 expect.soft(await story.count()?await story.innerText():'').toContain('скан');
 if(await story.count()){for(const img of await story.locator('img').all())expect.soft(await img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);await page.keyboard.press('Escape');await expect(story).not.toBeVisible();}
 await page.locator('select').selectOption('en');await expect.soft(page.locator('.sticker-paper')).toHaveText("That's me",{timeout:200});
 await page.locator('select').selectOption('ru');await page.route('**/story/scan.json',route=>route.abort());
 if(await page.locator('.story-trigger').count())await page.locator('.story-trigger').click();
 await expect.soft(page.locator('.scan-hint')).toContainText('Не удалось загрузить 3D',{timeout:1000});
});
