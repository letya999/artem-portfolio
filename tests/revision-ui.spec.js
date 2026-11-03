import {test,expect} from '@playwright/test';

test('compact hero has one action and all visible section headings end with a period',async({page})=>{
 for(const locale of ['ru','en','kk']){
  await page.goto('/'+locale);await expect(page.locator('.hero-copy a')).toHaveCount(1);await expect(page.locator('.hero-copy .intro')).toHaveCount(0);
  for(const heading of await page.locator('.human-shell section > h2,.section-top > h2,.about-copy > h2,.contact-top > h2').all())expect(await heading.innerText()).toMatch(/\.$/);
 }
});

test('XP hand trail follows a mouse, fades and stops with reduced motion',async({page})=>{
 await page.goto('/ru');expect(await page.locator('body').evaluate(e=>getComputedStyle(e).cursor)).toContain('xp-hand.svg');
 await page.mouse.move(30,200);await page.mouse.move(700,400,{steps:12});
 const ghosts=page.locator('.cursor-trail img');await expect.poll(()=>ghosts.evaluateAll(images=>images.filter(e=>Number(getComputedStyle(e).opacity)>.01).length)).toBeGreaterThan(0);
 await expect.poll(()=>ghosts.evaluateAll(images=>images.every(e=>Number(getComputedStyle(e).opacity)===0))).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(100,250,{steps:8});await expect(page.locator('.cursor-trail')).toBeHidden();
 expect(await ghosts.evaluateAll(images=>images.flatMap(e=>e.getAnimations()).length)).toBe(0);
});
