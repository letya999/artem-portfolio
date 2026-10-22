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

test('the note stays by the lower portrait without covering the face on a narrow screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/ru.html');
 const note=await page.locator('.portrait-sticker').boundingBox(),stage=await page.locator('.portrait-stage').boundingBox();
 expect(note.y).toBeGreaterThan(stage.y+stage.height*.65);
 expect(note.x+note.width).toBeLessThan(stage.x+stage.width*.5);
});

test('the note toggles shut and closes after pointer leaves',async({page})=>{
 await page.goto('/ru.html');
 const paper=page.locator('.sticker-paper');
 await paper.click();await expect(paper).toHaveAttribute('aria-expanded','true');
 await paper.click();await expect(paper).toHaveAttribute('aria-expanded','false');
 await paper.click();await page.mouse.move(0,0);await expect(paper).toHaveAttribute('aria-expanded','false');
});

test('the photo does not appear before the 3D portrait loads',async({page})=>{
 await page.route('**/voxel-portrait.json',async route=>{await new Promise(resolve=>setTimeout(resolve,1000));await route.continue();});
 await page.goto('/ru.html',{waitUntil:'domcontentloaded'});
 expect(await page.locator('.portrait-fallback').evaluate(el=>getComputedStyle(el).visibility)).toBe('hidden');
 await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
});
