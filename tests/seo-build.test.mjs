import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';

const output=mkdtempSync(join(tmpdir(),'artem-astro-seo-'));
test('static SEO build is portable and changes its absolute URLs with SITE_URL',()=>{
 for(const origin of ['https://portfolio.example','https://moved.example','']){
  const env={...process.env,SITE_URL:origin};
  const generate=spawnSync(process.execPath,['scripts/generate-static.js'],{env,encoding:'utf8'});
  assert.equal(generate.status,0,generate.stderr);
  const run=spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir',output],{env,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  for(const lang of ['ru','en','kk']){
   const html=readFileSync(`${output}/${lang}.html`,'utf8');
   assert.ok(html.includes(`<html lang="${lang}">`));assert.ok(html.includes('Twinby'));
   if(origin){assert.ok(html.includes(`rel="canonical" href="${origin}/${lang}"`));assert.ok(html.includes(`property="og:image" content="${origin}/social-card-v2.png"`));assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));assert.ok(existsSync(`${output}/social-card-v2.png`));}
   else assert.ok(!html.includes('rel="canonical"'));
   assert.equal((html.match(/id="profile-schema"/g)||[]).length,1);
   for(const match of html.matchAll(/(?:src|href)="\/_astro\/([^"]+)"/g))assert.ok(existsSync(`${output}/_astro/${match[1]}`));
  }
  assert.equal(existsSync(`${output}/sitemap.xml`),Boolean(origin));
  const robots=readFileSync(`${output}/robots.txt`,'utf8');
  if(origin){const sitemap=readFileSync(`${output}/sitemap.xml`,'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,4);assert.ok(sitemap.includes(`${origin}/en</loc>`));assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));}
  else assert.ok(!robots.includes('Sitemap:'));
 }
 const target=realpathSync(output),parent=realpathSync(tmpdir());
 assert.ok(target.startsWith(parent+sep));
 rmSync(target,{recursive:true});
});
