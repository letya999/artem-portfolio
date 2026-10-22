import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';

test('static SEO build is portable and changes its absolute URLs with SITE_URL',()=>{
 for(const origin of ['https://portfolio.example','https://moved.example','']){
  const run=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{env:{...process.env,SITE_URL:origin},encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  for(const lang of ['ru','en','kk']){
   const html=readFileSync(`dist/${lang}.html`,'utf8');
   assert.ok(html.includes(`<html lang="${lang}">`));assert.ok(html.includes('Twinby'));
   assert.ok(html.includes(`rel="canonical" href="${origin}/${lang}.html"`));
   assert.equal((html.match(/id="profile-schema"/g)||[]).length,1);
   for(const match of html.matchAll(/(?:src|href)="\.\/assets\/([^"]+)"/g))assert.ok(existsSync(`dist/assets/${match[1]}`));
  }
  assert.equal(existsSync('dist/sitemap.xml'),Boolean(origin));
  const robots=readFileSync('dist/robots.txt','utf8');
  if(origin){const sitemap=readFileSync('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,4);assert.ok(sitemap.includes(`${origin}/en.html`));assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));}
  else assert.ok(!robots.includes('Sitemap:'));
 }
});
