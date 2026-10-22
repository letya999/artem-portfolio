import { test, expect } from '@playwright/test';

test('achievements follow the hero; scroll assembles Little law and reverse scroll restores the portrait', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    window.portraitScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      if (event.detail.isScene) window.portraitScenes.push(event.detail);
      if (typeof event.detail.render === 'function') {
        const renderer = event.detail, render = renderer.render;
        window.portraitRenderer = renderer;
        renderer.render = function(scene, camera) {
          window.portraitCamera = camera;
          return render.call(this, scene, camera);
        };
      }
    });
  });
  await page.goto('/');
  await expect(page.locator('.hero + #results h2')).toHaveText('Достижения в цифрах.');
  await expect(page.getByRole('img', {name: 'Закон Литтла: Lead time равно WIP, делённому на Throughput'})).toBeAttached();
  await expect(page.locator('.equation-fraction')).toHaveText('WIPThroughput');
  const stage = page.locator('.portrait-stage');
  await expect(stage).toHaveClass(/loaded/);
  await page.evaluate(() => {
    const portrait = window.portraitScenes.flatMap(scene => scene.children).find(mesh => mesh.userData.cubeCount);
    window.restBands = portrait.children.map(band => band.instanceMatrix.array.slice());
  });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#results').offsetTop - innerHeight * .71);
  });
  const changedCubes = () => page.evaluate(() => {
    const objects = window.portraitScenes.flatMap(scene => scene.children);
    const portrait = objects.find(mesh => mesh.userData.cubeCount);
    const equation = objects.find(mesh => mesh.geometry?.attributes.equationTarget);
    let changed = 0;
    portrait.children.forEach((band, index) => {
      for (let i = 0; i < band.count; i++) {
        if (band.instanceMatrix.array.subarray(i * 16, i * 16 + 16).some((value, j) => value !== window.restBands[index][i * 16 + j])) changed++;
      }
    });
    return {changed, expected: equation.count, visible: portrait.visible};
  });
  await expect.poll(async () => (await changedCubes()).changed).toBeGreaterThan(0);
  const partial = await changedCubes();
  expect(partial.changed, 'Only the cubes used for the equation should leave the original head').toBe(partial.expected);
  expect(partial.visible).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#results').offsetTop);
  });
  await expect.poll(() => page.evaluate(() => {
    const meshes = window.portraitScenes.flatMap(scene => scene.children);
    const portrait = meshes.find(mesh => mesh.userData.cubeCount);
    const equation = meshes.find(mesh => mesh.geometry?.attributes.equationTarget);
    return Boolean(equation?.visible && !portrait.visible && equation.count < 5000 && equation.userData.progress.value === 1);
  }), {message: 'The sampled cubes must assemble as the equation'}).toBe(true);
  await expect(page.locator('.equation-typeset')).toBeHidden();
  await expect(stage.locator('canvas')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stage).toHaveAttribute('data-equation-progress', '0');
  await expect(stage.locator('canvas')).toBeVisible();
  expect((await changedCubes()).changed, 'Reverse scroll must restore every extracted cube').toBe(0);
  const aspects = await page.evaluate(() => {
    const canvas = document.querySelector('.portrait-stage canvas');
    const stage = document.querySelector('.portrait-stage').getBoundingClientRect();
    return {buffer: canvas.width / canvas.height, host: stage.width / stage.height, camera: window.portraitCamera.right / 2.05};
  });
  expect.soft(aspects.buffer, 'Restore the portrait drawing buffer after the wider formula').toBeCloseTo(aspects.host, 2);
  expect.soft(aspects.camera, 'Restore the portrait camera after reverse scrolling').toBeCloseTo(aspects.host, 2);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.setViewportSize({width: 390, height: 844});
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#results').offsetTop));
  await expect(page.locator('.equation-typeset')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
