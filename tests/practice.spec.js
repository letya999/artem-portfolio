import {test,expect} from '@playwright/test';

test('three voxel disciplines disclose grounded detail independently of the conveyor',async({page})=>{
  await page.goto('/');
  const section=page.locator('.practice');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('canvas[data-voxel-count]')).toBeVisible();
  const contracts=await section.evaluate(s=>({
    dialogs:!!s.querySelector('dialog'),
    detailButtons:s.querySelectorAll('.practice-more').length,
    renderer:!!s.querySelector('canvas[data-voxel-count]'),
  }));
  // Expanded flowing vocabularies replace the former three fixed tags per area.
  // Their required terms and minimum size are checked in practice-orbit.spec.js.
  expect.soft(contracts).toEqual({dialogs:true,detailButtons:3,renderer:true});
  await expect.soft(section.locator(':scope > h2')).toHaveText('От общего языка к общему результату.');
  await expect.soft(section.locator('h2 br')).toHaveCount(0);
  await expect.soft(section.locator('.practice-area')).toHaveCount(3);
  for(const name of ['Процессы','Инженерка','Продукт']){
    await section.locator('.practice-area').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button',{name:'Узнать подробнее'}).click();
    const dialog=page.getByRole('dialog');
    await expect.soft(dialog).toBeVisible({timeout:500});
    if(!await dialog.isVisible())continue;
    await expect(dialog.getByRole('heading',{name,exact:true})).toBeVisible();
    expect((await dialog.innerText()).length).toBeGreaterThan(300);
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  }
  expect.soft(await section.locator('canvas').count()).toBe(1);
  if(await section.locator('canvas').count())expect.soft(Number(await section.locator('canvas').getAttribute('data-voxel-count'))).toBeGreaterThan(1000);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
