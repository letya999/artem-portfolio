import {test,expect} from '@playwright/test';

test('scan viewer loads the original textured GLB rather than the stripped geometry',async({page})=>{
 const requested=[];page.on('response',response=>{if(response.url().includes('/story/models/'))requested.push(response.url());});
 await page.goto('/ru.html');
 await page.locator('.sticker-paper').click();
 await page.locator('.story-trigger').click();
 await expect(page.locator('.story-dialog .scan-preview')).toHaveAttribute('data-source','./story/models/iphone-scan.glb');
 await expect.poll(()=>requested.some(url=>url.endsWith('/iphone-scan.glb'))).toBe(true);
});

test('archived model previews load their own model assets',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 await page.locator('.story-dialog figure').first().locator('.story-media-trigger').click();
 await expect(page.locator('.story-viewer .scan-preview')).toHaveAttribute('data-source','./story/models/original-voxel.glb');
 await expect(page.locator('.story-viewer .scan-preview')).toHaveAttribute('data-state','ready');
});

test('photo-derived surface is its own interactive stage before the iPhone scan',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 await page.locator('.story-dialog figure').nth(3).locator('.story-media-trigger').click();
 await expect(page.locator('.story-viewer .scan-preview')).toHaveAttribute('data-source','./story/models/photo-reconstruction.json');
 await expect(page.locator('.story-viewer .scan-preview')).toHaveAttribute('data-state','ready');
});

test('the restored chronology remains localized',async({page})=>{
 await page.goto('/ru.html');await page.locator('select').selectOption('en');
 await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 await expect(page.locator('.story-dialog figure').first().locator('h3')).toHaveText('First voxel portrait');
 await expect(page.locator('.story-dialog figure').nth(4).locator('h3')).toHaveText('Original iPhone scan');
});

test('archived models fit in the viewer and show the detailed face',async({page})=>{
 await page.goto('/ru.html');await page.locator('.sticker-paper').click();await page.locator('.story-trigger').click();
 for(const [index,maxBottom,minContrast] of [[0,.02,0],[6,.02,25]]){
  await page.locator('.story-dialog figure').nth(index).locator('.story-media-trigger').click();
  const preview=page.locator('.story-viewer .scan-preview');await expect(preview).toHaveAttribute('data-state','ready');
  const png=await preview.screenshot();
  const stats=await page.evaluate(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let bottom=0,dark=0,sum=0,sumSq=0;for(let y=0;y<c.height;y++)for(let col=0;col<c.width;col++){const i=(y*c.width+col)*4,v=(d[i]+d[i+1]+d[i+2])/3;if(v<190){dark++;sum+=v;sumSq+=v*v;if(y>c.height*.96)bottom++;}}resolve({bottom:bottom/c.width/(c.height*.04),mean:sum/dark,contrast:Math.sqrt(sumSq/dark-(sum/dark)**2)});};image.src=src;}),`data:image/png;base64,${png.toString('base64')}`);
  expect(stats.bottom).toBeLessThan(maxBottom);expect(stats.contrast).toBeGreaterThan(minContrast);if(index===0)expect(stats.mean).toBeGreaterThan(70);
  await page.locator('.story-viewer .dialog-close').click();
 }
});

test('making-of follows distinct archived models through the textured scan and later reconstructions',async({page})=>{
 await page.goto('/ru.html');
 await page.locator('.sticker-paper').click();
 await page.locator('.story-trigger').click();
 const story=page.locator('.story-dialog');
 await expect(story.locator('#story-title')).toHaveText('От первых кубиков к движению.');
 await expect(story.locator('figure')).toHaveCount(8);
 await expect(story.locator('.story-number')).toHaveText(['01','02','03','04','05','06','07','08']);
 for(const [index,file] of [[0,'thumb-0.png'],[1,'thumb-1.png'],[2,'landmarks.png'],[3,'thumb-2.png'],[4,'thumb-3.png'],[5,'thumb-4.png'],[6,'thumb-5.png'],[7,'thumb-6.png']])
  await expect(story.locator('figure').nth(index).locator('img')).toHaveAttribute('src',new RegExp(file));
 const sources=[];
 for(const index of [0,1,4,5,6,7]){
  await story.locator('figure').nth(index).locator('.story-media-trigger').click();
  const preview=page.locator('.story-viewer .scan-preview');
  await expect(preview).toHaveAttribute('data-state','ready');
  sources.push(await preview.getAttribute('data-source'));
  await page.locator('.story-viewer .dialog-close').click();
 }
 expect(new Set(sources).size).toBe(sources.length);
 expect(sources[0]).toContain('original-voxel');
 expect(sources[2]).toContain('iphone-scan');
 const glb=await page.request.get(sources[2]);
 expect(glb.ok()).toBe(true);
 expect(glb.headers()['content-type']).toMatch(/model|octet-stream/);
});
