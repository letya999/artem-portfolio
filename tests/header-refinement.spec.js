import {test,expect} from '@playwright/test';

test('the portrait note stays to the left of the portrait at desktop and mobile widths',async({page})=>{
 await page.goto('/ru');
 await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/,{timeout:20000});
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:900});
  const note=await page.locator('.sticker-paper').boundingBox(),portrait=await page.locator('.portrait-stage').boundingBox();
  expect.soft(note.x,`${width}: note stays on screen`).toBeGreaterThanOrEqual(0);
  expect.soft(note.x+note.width,`${width}: note stays left of the portrait`).toBeLessThanOrEqual(portrait.x);
  expect.soft(note.y,`${width}: note is alongside the portrait`).toBeGreaterThanOrEqual(portrait.y);
  expect.soft(note.y+note.height,`${width}: note is not below the portrait`).toBeLessThanOrEqual(portrait.y+portrait.height);
 }
 await page.setViewportSize({width:768,height:900});await page.goto('/en');
 const label=await page.locator('.sticker-paper').evaluate(el=>({width:el.clientWidth,content:el.scrollWidth}));
 expect(label.content,'The English label must fit its paper').toBeLessThanOrEqual(label.width);
});

test('the revealed making-of button remains readable inside the small mobile note',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 for(const locale of ['ru','en','kk']){
  await page.goto(`/${locale}`);await page.locator('.sticker-paper').click();
  const size=await page.locator('.story-trigger').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight}));
  expect.soft(size.content,locale).toBeLessThanOrEqual(size.height);
 }
});

test('header offers five section links and a keyboard accessible resume dropdown in every language',async({page})=>{
 for(const locale of ['ru','en','kk']){
  await page.goto(`/${locale}`);
  await expect(page.locator('.resume-menu')).toHaveCount(1);
  const nav=page.locator('.human-shell > header nav');
  for(const id of ['results','experience','about','conveyor','contact'])await expect.soft(nav.locator(`a[href="#${id}"]`)).toBeVisible();
  const menu=page.locator('.resume-menu'),trigger=menu.locator('summary');
  await expect(menu.locator('#resume-markdown')).toBeHidden();
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(menu.locator('#resume-pdf')).toBeVisible();
  await expect(menu.locator('#resume-markdown')).toHaveAttribute('href',`/resume.${locale}.md`);
  await page.keyboard.press('Escape');await expect(menu).not.toHaveAttribute('open','');
  await trigger.click();await page.mouse.click(8,180);await expect(menu).not.toHaveAttribute('open','');
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:900});
   const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,client:innerWidth,right:document.querySelector('#language-select').getBoundingClientRect().right}));
   expect(layout.width,`${locale} ${width}: horizontal overflow`).toBeLessThanOrEqual(layout.client);
   expect(layout.right).toBeLessThanOrEqual(width);
   await trigger.click();await expect(menu.locator('#resume-pdf')).toBeVisible();await page.keyboard.press('Escape');
  }
 }
});
