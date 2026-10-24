import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';

test('analytics tags activate only when valid IDs are configured',()=>{
 const output=mkdtempSync(join(tmpdir(),'artem-analytics-'));
 try{
  for(const [ga,ym,enabled] of [['G-ABC1234567','12345678',true],['','',false]]){
   const env={...process.env,PUBLIC_GA_MEASUREMENT_ID:ga,PUBLIC_YANDEX_METRIKA_ID:ym};
   const run=spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir',output],{env,encoding:'utf8'});
   assert.equal(run.status,0,run.stderr);
   for(const page of ['ru.html','404.html']){
    const html=readFileSync(join(output,page),'utf8');
    assert.equal(html.includes('googletagmanager.com/gtag/js?id=G-ABC1234567'),enabled);
    assert.equal(html.includes('mc.yandex.ru/metrika/tag.js'),enabled);
   }
  }
 }finally{const target=realpathSync(output),parent=realpathSync(tmpdir());assert.ok(target.startsWith(parent+sep));rmSync(target,{recursive:true});}
});
