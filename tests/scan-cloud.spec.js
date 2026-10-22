import {test,expect} from '@playwright/test';

test('scan stays inside a mobile dialog and supports zoom/reset; resources are titled in all languages',async({page})=>{
 await page.goto('/ru.html',{waitUntil:'domcontentloaded'});await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 await page.locator('.scan-preview').scrollIntoViewIfNeeded();await expect(page.locator('.scan-preview')).toHaveAttribute('data-state','ready');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 const dialog=page.locator('.story-dialog');expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'viewer must not stretch modal horizontally').toBe(true);
 const canvas=page.locator('.scan-preview canvas');await expect(canvas).toBeVisible();
 const before=await canvas.screenshot();await page.getByRole('button',{name:'Приблизить',exact:true}).click();
 expect((await canvas.screenshot()).equals(before),'zoom changes the rendered model').toBe(false);
 await page.getByRole('button',{name:'Исходный вид',exact:true}).click();await expect(page.locator('.scan-preview')).toHaveAttribute('data-state','ready');
 await page.keyboard.press('Escape');
 for(const [locale,title] of [['ru','Мои ресурсы'],['en','My resources'],['kk','Менің ресурстарым']]){
  await page.locator('select').selectOption(locale);await expect(page.locator('#conveyor h2')).toHaveText(title);
 }
 await page.locator('select').selectOption('ru');await page.route('**/story/models/iphone-scan.glb',r=>r.abort());await page.locator('.story-trigger').click();
 await expect(page.locator('.scan-preview')).toHaveAttribute('data-state','error');await page.unroute('**/story/models/iphone-scan.glb');await page.getByRole('button',{name:'Повторить загрузку',exact:true}).click();await expect(page.locator('.scan-preview')).toHaveAttribute('data-state','ready');
});
