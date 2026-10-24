import {test,expect} from '@playwright/test';

test('404 page shows a playable Rickroll and a route home',async({page})=>{
 const response=await page.goto('/this-page-does-not-exist');
 expect(response?.status()).toBe(404);
 await expect(page.getByRole('heading',{name:'404'})).toBeVisible();
 const player=page.getByTitle('Rick Astley — Never Gonna Give You Up');
 await expect(player).toBeVisible();
 await expect(player).toHaveAttribute('src',/player\.vimeo\.com\/video\/1126541722\?autoplay=1/);
 await expect(page.getByRole('button',{name:'Включить звук'})).toBeVisible();
 await expect(page.getByRole('link',{name:/на главную/i})).toHaveAttribute('href','/');
 await page.screenshot({path:'qa/404.png'});
});

test('404 attempts to start playback with sound immediately',async({page})=>{
 await page.route('https://player.vimeo.com/api/player.js',route=>route.fulfill({
  contentType:'application/javascript',
  body:`window.Vimeo={Player:class{ready(){return Promise.resolve()}play(){window.calls.push('play');return Promise.resolve()}setMuted(value){window.calls.push(['muted',value]);return Promise.resolve()}setVolume(value){window.calls.push(['volume',value]);return Promise.resolve()}getMuted(){return Promise.resolve(true)}}};window.calls=[];`
 }));
 await page.goto('/this-page-does-not-exist');
 await expect.poll(()=>page.evaluate(()=>window.calls)).toEqual(['play',['muted',false],['volume',1]]);
});
