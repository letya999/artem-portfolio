import {test,expect} from '@playwright/test';
test('small paper sits right of the head and reveals a reachable making-of button',async({page})=>{
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});await page.goto('/ru');
  const note=await page.locator('.portrait-sticker').boundingBox(),stage=await page.locator('.portrait-stage').boundingBox();
  expect(note.width).toBeLessThan(130);expect(note.x).toBeGreaterThan(stage.x+stage.width*.6);expect(note.x+note.width).toBeLessThan(width);
 }
 await page.locator('.portrait-sticker').hover();const trigger=page.locator('.story-trigger');
 await expect(trigger).toHaveCSS('pointer-events','auto');await trigger.click();
 await expect(page.locator('.story-dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 await page.mouse.move(0,0);await page.locator('.hero h1').click();
 const paper=page.locator('.sticker-paper');await paper.focus();await page.keyboard.press('Enter');
 await expect(paper).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Tab');await expect(trigger).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('.story-dialog')).toBeVisible();
});
test('the same static 3D portrait covers module loading, data loading and WebGL loss',async({page})=>{
 let releaseModule,releaseModel;const moduleHeld=new Promise(r=>releaseModule=r),modelHeld=new Promise(r=>releaseModel=r);
 await page.route('**/src/Portrait.jsx',async route=>{await moduleHeld;await route.continue();});
 await page.route('**/voxel-portrait.json',async route=>{await modelHeld;await route.continue();});
 const modelRequest=page.waitForRequest(/voxel-portrait\.json/);
 try{
  await page.goto('/ru',{waitUntil:'domcontentloaded'});const fallback=page.locator('.portrait-fallback');
  await expect(fallback).toBeVisible();await expect(fallback).toHaveAttribute('src','/portrait-poster.webp');
  await expect.poll(()=>fallback.evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  releaseModule();await modelRequest;await expect(fallback).toBeVisible();await expect(fallback).toHaveAttribute('src','/portrait-poster.webp');
  releaseModel();await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});await expect(fallback).toBeHidden();
  await page.locator('.portrait-stage canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(fallback).toBeVisible();await expect(fallback).toHaveAttribute('src','/portrait-poster.webp');
 }finally{releaseModule();releaseModel();}
});
