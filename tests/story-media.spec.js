import {test,expect} from '@playwright/test';

test('eight steps include the landmarks image and use consistent opening actions',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 const cards=page.locator('.story-dialog figure');await expect(cards).toHaveCount(8);
 await expect(cards.nth(2).locator('img')).toHaveAttribute('src',/landmarks\.png/);
 await expect(page.locator('.story-dialog .story-media-trigger')).toHaveCount(8);
 await expect(page.locator('.story-dialog')).not.toContainText(/архив|коммит/i);
 await cards.nth(2).locator('.story-media-trigger').click();
 await expect(page.locator('.story-viewer img')).toHaveAttribute('src',/landmarks\.png/);
});

test('every making-of step opens its own media; the original textured scan rotates',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 const story=page.locator('.story-dialog');await expect(story.locator('figure')).toHaveCount(8);
 await expect(story.locator('figure').nth(4).locator('.scan-preview')).toHaveAttribute('data-state','ready');
 await expect(story.locator('.story-media-trigger')).toHaveCount(8);
 for(const [index,source] of [[0,'original-voxel.glb'],[1,'metal-first.json'],[3,'photo-reconstruction.json'],[4,'iphone-scan.glb'],[5,'scan-transfer.json'],[6,'dense-reconstruction.json'],[7,'voxel-portrait.json']]){
  await story.locator('figure').nth(index).locator('.story-media-trigger').click();
  const preview=page.locator('.story-viewer .scan-preview');await expect(preview).toHaveAttribute('data-state','ready');
  await expect(preview).toHaveAttribute('data-source',new RegExp(source));
  await page.locator('.story-viewer .dialog-close').click();
 }
});
