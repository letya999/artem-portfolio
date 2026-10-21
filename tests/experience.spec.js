import {test, expect} from '@playwright/test';
const check = expect.configure({soft: true, timeout: 1500});

test('each job has one aligned matryoshka, newest first and largest first; returning restores the hero', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 1920, height: 1080});
  await page.addInitScript(() => {
    window.portraitScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      if (event.detail.isScene) window.portraitScenes.push(event.detail);
      if (typeof event.detail.render === 'function') {
        const renderer = event.detail, render = renderer.render;
        renderer.render = function(scene, camera) { window.portraitCamera = camera; return render.call(this, scene, camera); };
      }
    });
  });
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await check(page.locator('#experience .company')).toHaveText(['Twinby', 'Финтех-холдинг', 'МТС', 'ЮMoney', 'Itis Team', 'Renewal Studio']);
  await check(page.locator('.career-entry .matryoshka-slot')).toHaveCount(6);
  await check(page.locator('#experience .business')).toHaveCount(6);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.querySelector('#experience').offsetTop); });
  const models = () => page.evaluate(async () => {
    const {Vector3} = await import('/node_modules/three/build/three.module.js');
    const mesh = window.portraitScenes.flatMap(scene => scene.children).find(mesh => mesh.geometry?.attributes.equationTarget);
    const target = mesh.geometry.attributes.experienceTarget, camera = window.portraitCamera;
    const canvas = document.querySelector('.portrait-stage canvas').getBoundingClientRect();
    mesh.updateMatrixWorld(); camera.updateMatrixWorld();
    const bounds = Array.from({length: 6}, () => ({min: Infinity, max: -Infinity}));
    for (let i = 0; i < target.count; i++) {
      const group = Math.min(5, Math.floor(i * 6 / target.count));
      const p = new Vector3(target.getX(i), target.getY(i), target.getZ(i)).applyMatrix4(mesh.matrixWorld).project(camera);
      const y = canvas.top + (1 - p.y) / 2 * canvas.height;
      bounds[group].min = Math.min(bounds[group].min, y); bounds[group].max = Math.max(bounds[group].max, y);
    }
    const slots = [...document.querySelectorAll('.career-entry .matryoshka-slot')].map(slot => slot.getBoundingClientRect());
    return {flow: mesh.userData.experienceProgress.value, aligned: slots.length === 6 && slots.every((slot, i) => Math.abs((slot.top + slot.bottom) / 2 - (bounds[i].min + bounds[i].max) / 2) < 15), heights: bounds.map(b => b.max - b.min)};
  });
  await check.poll(async () => (await models()).flow).toBe(1);
  await check.poll(async () => (await models()).aligned, {message: 'Every doll must remain opposite its own job row'}).toBe(true);
  const heights = (await models()).heights;
  check(heights.every((height, i) => i === 0 || height < heights[i - 1]), 'Dolls must get smaller from Twinby to Renewal Studio').toBe(true);
  await page.locator('#experience summary').first().click();
  await check.poll(async () => (await models()).aligned, {message: 'Alignment must survive expanding and collapsing job details'}).toBe(true);
  await page.setViewportSize({width: 1440, height: 900});
  await check.poll(async () => (await models()).aligned, {message: 'Resize must preserve row alignment rather than restore the hero camera'}).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.portrait-stage')).toHaveAttribute('data-equation-progress', '0');
  const hero = await page.evaluate(() => {
    const model = window.portraitScenes.flatMap(scene => scene.children).find(mesh => mesh.userData.cubeCount);
    const stage = document.querySelector('.portrait-stage').getBoundingClientRect(), canvas = document.querySelector('.portrait-stage canvas').getBoundingClientRect();
    return {x: model.position.x, y: model.position.y, left: Math.abs(stage.left - canvas.left), right: Math.abs(stage.right - canvas.right)};
  });
  check(hero.x).toBe(0); check(hero.y).toBe(0); check(hero.left).toBeLessThan(1); check(hero.right).toBeLessThan(1);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.setViewportSize({width: 390, height: 844});
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#experience').offsetTop));
  await check.poll(async () => (await models()).aligned).toBe(true);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
