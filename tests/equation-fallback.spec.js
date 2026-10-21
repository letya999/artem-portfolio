import {test, expect} from '@playwright/test';

test('WebGL context loss during the equation restores the readable formula', async ({page}) => {
  await page.goto('/');
  const stage = page.locator('.portrait-stage');
  await expect(stage).toHaveClass(/loaded/);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#results').offsetTop);
  });
  await expect(page.locator('.equation-typeset')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector('.portrait-stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(stage).not.toHaveClass(/loaded/);
  await expect(page.locator('.equation-typeset')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Пауза', exact: true})).toBeDisabled();
});
