import {test,expect} from '@playwright/test';

test('portrait note sits clear of the face and reads as folded paper',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/ru.html');
 const note=page.locator('.portrait-sticker'),stage=page.locator('.portrait-stage');
 const sticker=await note.boundingBox(),portrait=await stage.boundingBox();
 expect(sticker.x+sticker.width).toBeLessThan(portrait.x+portrait.width*.25);
 expect(await page.locator('.sticker-paper').evaluate(el=>getComputedStyle(el,'::before').content)).not.toBe('none');
 expect(await page.locator('.sticker-arrow path').count()).toBeGreaterThanOrEqual(2);
});

test('the note stays below the portrait on a narrow screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/ru.html');
 const note=await page.locator('.portrait-sticker').boundingBox(),stage=await page.locator('.portrait-stage').boundingBox();
 expect(note.y).toBeGreaterThanOrEqual(stage.y+stage.height);
});
