import {test,expect} from '@playwright/test';

test('mobile shows the 3D loader while the model arrives automatically',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 let release;
 const held=new Promise(resolve=>{release=resolve});
 await page.route('**/voxel-portrait.json',async route=>{await held;await route.continue();});
 const modelRequest=page.waitForRequest(/voxel-portrait\.json/);
 await page.goto('/ru.html',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.portrait-loading-preview')).toBeVisible();
 await expect(page.getByRole('button',{name:'Показать 3D-портрет'})).toHaveCount(0);
 await expect(page.locator('.portrait-fallback')).not.toBeVisible();
 await modelRequest;
 await expect(page.locator('.portrait-loading-preview')).toBeVisible();
 release();
 await expect(page.locator('.portrait-stage.loaded')).toBeVisible({timeout:30000});
 await expect(page.locator('.portrait-loading-preview')).toBeHidden();
});

test('navigation fits tablet and narrow mobile widths',async({page})=>{
 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:844});
  await page.goto('/ru.html');
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,right:document.querySelector('#language-select').getBoundingClientRect().right}));
  expect(layout.scroll,`${width}px document overflow`).toBeLessThanOrEqual(layout.client);
  expect(layout.right,`${width}px language selector overflow`).toBeLessThanOrEqual(width);
 }
});
