import {test, expect} from '@playwright/test';

test('coarse steel cubes form a deep equation while the entire bust dissolves under a single-line heading', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.addInitScript(() => {
    window.portraitScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      if (event.detail.isScene) window.portraitScenes.push(event.detail);
      if (typeof event.detail.render === 'function') {
        const renderer = event.detail, render = renderer.render;
        renderer.render = function(scene, camera) { window.portraitRenderer = renderer; window.portraitCamera = camera; return render.call(this, scene, camera); };
      }
    });
  });
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  const state = () => page.evaluate(() => {
    const objects = window.portraitScenes.flatMap(scene => scene.children);
    const equation = objects.find(mesh => mesh.geometry?.attributes.equationTarget);
    const portrait = objects.find(mesh => mesh.userData.cubeCount);
    const heading = document.querySelector('.achievements-heading');
    return {
      count: equation.count,
      portraitVisible: portrait.visible,
      dissolve: portrait.userData.dissolve.value,
      progress: equation.userData.progress.value,
      releaseSpread: equation.geometry.attributes.equationRelease ? Math.max(...equation.geometry.attributes.equationRelease.array) - Math.min(...equation.geometry.attributes.equationRelease.array) : 0,
      metalness: equation.material.metalness,
      cubePixels: equation.geometry.attributes.equationTarget.getW(0) * document.querySelector('.portrait-stage').getBoundingClientRect().height / 4.1,
      equationWidth: document.querySelector('.equation-slot').getBoundingClientRect().width,
      headingLines: heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight),
    };
  });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#results').offsetTop - innerHeight * .71);
  });
  await expect.poll(async () => (await state()).progress).toBeGreaterThan(0);
  const middle = await state();
  expect.soft(middle.count).toBeGreaterThanOrEqual(800);
  expect.soft(middle.count).toBeLessThanOrEqual(5000);
  expect.soft(middle.portraitVisible, 'The whole bust remains animated while disintegrating').toBe(true);
  expect.soft(middle.dissolve).toBeGreaterThan(0);
  expect.soft(middle.headingLines).toBeLessThan(1.2);
  expect.soft(middle.equationWidth).toBeGreaterThan(720);
  expect.soft(middle.metalness).toBeGreaterThanOrEqual(.95);
  expect.soft(middle.cubePixels, 'Individual steel blocks must be visibly larger than the old pixel grain').toBeGreaterThan(5);
  expect.soft(middle.releaseSpread, 'Cubes should start falling gradually rather than all at the same instant').toBeGreaterThan(.15);
  expect.soft(middle.releaseSpread, 'Staggering must finish within the scroll transition').toBeLessThan(.3);
  const timing = await page.evaluate(async () => {
    const {WebGLRenderTarget} = await import('/node_modules/three/build/three.module.js');
    const scene = window.portraitScenes.find(scene => scene.children.some(mesh => mesh.userData.cubeCount));
    const equation = scene.children.find(mesh => mesh.geometry?.attributes.equationTarget);
    const portrait = scene.children.find(mesh => mesh.userData.cubeCount);
    const release = equation.geometry.attributes.equationRelease;
    if (!release) return {late: -1, early: -1};
    const renderer = window.portraitRenderer, target = new WebGLRenderTarget(256, 256), previous = renderer.getRenderTarget();
    const saved = {count: equation.count, visible: portrait.visible, release: release.getX(0), progress: equation.userData.progress.value};
    const frames = [];
    try {
      equation.count = 1; portrait.visible = false; renderer.setRenderTarget(target);
      for (const [progress, delay] of [[0, 0], [.1, .22], [.1, 0]]) {
        equation.userData.progress.value = progress; release.setX(0, delay); release.needsUpdate = true;
        renderer.render(scene, window.portraitCamera);
        const pixels = new Uint8Array(256 * 256 * 4);
        renderer.readRenderTargetPixels(target, 0, 0, 256, 256, pixels); frames.push(pixels);
      }
      const changed = frame => frame.reduce((count, value, i) => count + (i % 4 === 3 && value !== frames[0][i] ? 1 : 0), 0);
      return {late: changed(frames[1]), early: changed(frames[2])};
    } finally {
      equation.count = saved.count; portrait.visible = saved.visible; equation.userData.progress.value = saved.progress;
      release.setX(0, saved.release); release.needsUpdate = true; renderer.setRenderTarget(previous); target.dispose();
    }
  });
  expect.soft(timing.late, 'A late cube must remain at its original position before release').toBe(0);
  expect.soft(timing.early, 'An early cube must already be falling at the same scroll position').toBeGreaterThan(2);
});
