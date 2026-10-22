import {test,expect} from '@playwright/test';

test('every making-of step opens its own media; the original textured scan rotates',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 const story=page.locator('.story-dialog');await expect(story.locator('figure')).toHaveCount(7);
 await expect(story.locator('figure').nth(3).locator('.scan-preview')).toHaveAttribute('data-state','ready');
 await expect(story.locator('.story-media-trigger')).toHaveCount(7);
 for(const [index,source] of [[0,'original-voxel.glb'],[1,'metal-first.json'],[2,'photo-reconstruction.json'],[3,'iphone-scan.glb'],[4,'scan-transfer.json'],[5,'dense-reconstruction.json'],[6,'voxel-portrait.json']]){
  await story.locator('figure').nth(index).locator('.story-media-trigger').click();
  const preview=page.locator('.story-viewer .scan-preview');await expect(preview).toHaveAttribute('data-state','ready');
  await expect(preview).toHaveAttribute('data-source',new RegExp(source));
  await page.locator('.story-viewer .dialog-close').click();
 }
});
