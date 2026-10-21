import {test, expect} from '@playwright/test';

test('the assembled equation has real depth and gently turns with the cursor', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.addInitScript(() => {
    window.portraitScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      if (event.detail.isScene) window.portraitScenes.push(event.detail);
    });
  });
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#results').offsetTop);
  });
  const pose = () => page.evaluate(() => {
    const mesh = window.portraitScenes.flatMap(scene => scene.children).find(mesh => mesh.geometry?.attributes.equationTarget);
    const targets = mesh.geometry.attributes.equationTarget;
    let front = -Infinity, back = Infinity, left = Infinity, right = -Infinity;
    for (let i = 0; i < targets.count; i++) {
      front = Math.max(front, targets.getZ(i)); back = Math.min(back, targets.getZ(i));
      left = Math.min(left, targets.getX(i)); right = Math.max(right, targets.getX(i));
    }
    return {yaw: mesh.rotation.y, pitch: mesh.rotation.x, depth: (front - back) / (right - left), progress: mesh.userData.progress.value};
  });
  await expect.poll(async () => (await pose()).progress).toBe(1);
  expect.soft((await pose()).depth, 'Three layers of coarse cubes must give the letters real depth').toBeGreaterThan(.015);
  expect.soft((await pose()).depth, 'Keep the extrusion shallow enough to preserve letter openings').toBeLessThan(.04);
  expect.soft(Math.abs((await pose()).yaw), 'A three-quarter pose must show the sides of the letters').toBeGreaterThan(.1);
  const slot = page.locator('.equation-slot'), rect = await slot.boundingBox();
  await page.mouse.move(rect.x, rect.y + rect.height / 2);
  await expect.soft.poll(async () => (await pose()).yaw, {message: 'Cursor left must gently turn the equation'}).toBeLessThan(-.25);
  const leftPose = await slot.screenshot();
  await page.mouse.move(rect.x + rect.width, rect.y + rect.height / 2);
  await expect.soft.poll(async () => (await pose()).yaw, {message: 'Cursor right must turn it in the opposite direction'}).toBeGreaterThan(-.15);
  expect.soft(Math.abs((await pose()).yaw), 'Keep the equation readable while turning').toBeLessThan(.5);
  expect.soft((await slot.screenshot()).equals(leftPose), 'Cursor movement must change rendered geometry').toBe(false);
});
