import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';

test('analytics tags activate only when valid IDs are configured',()=>{
 const output=mkdtempSync(join(tmpdir(),'artem-analytics-'));
 try{
  for(const [ga,ym,googleEnabled,yandexEnabled] of [['G-ABC1234567','12345678',true,true],['','114060319',false,true],['','',false,false],['invalid','not-a-counter',false,false]]){
   const env={...process.env,PUBLIC_GA_MEASUREMENT_ID:ga,PUBLIC_YANDEX_METRIKA_ID:ym};
   const run=spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir',output],{env,encoding:'utf8'});
   assert.equal(run.status,0,run.stderr);
   for(const page of ['index.html','ru.html','en.html','kk.html','404.html']){
    const html=readFileSync(join(output,page),'utf8');
    assert.equal(html.includes('googletagmanager.com/gtag/js'),googleEnabled,`${page}: Google ${ga}`);
    if(googleEnabled)assert.ok(html.includes(`googletagmanager.com/gtag/js?id=${ga}`),page);
    assert.equal(html.includes('mc.yandex.ru/metrika/tag.js'),yandexEnabled,`${page}: Yandex ${ym}`);
    assert.equal(html.includes('https://mc.yandex.ru/watch/'),yandexEnabled,`${page}: pixel ${ym}`);
    if(yandexEnabled){
     assert.equal(html.split(`ym(${ym},'init'`).length-1,1,page);
     assert.ok(html.includes(`metrika/tag.js?id=${ym}`),page);
     for(const option of ['ssr:true','webvisor:true','clickmap:true',"ecommerce:'dataLayer'",'referrer:document.referrer','url:location.href','accurateTrackBounce:true','trackLinks:true'])assert.ok(html.includes(option),`${page}: ${option}`);
     assert.ok(html.indexOf(`<body`)<html.indexOf(`<noscript><div><img src="https://mc.yandex.ru/watch/${ym}"`),page);
    }
   }
  }
 }finally{const target=realpathSync(output),parent=realpathSync(tmpdir());assert.ok(target.startsWith(parent+sep));rmSync(target,{recursive:true});}
});

test('development does not collect analytics even with valid IDs',()=>{
 const source=`
  import assert from 'node:assert/strict';
  import {dev} from 'astro';
  const server=await dev({server:{host:'127.0.0.1',port:0}});
  try{
   const response=await fetch('http://127.0.0.1:'+server.address.port+'/ru');
   assert.equal(response.status,200);
   const html=await response.text();
   assert.ok(!html.includes('mc.yandex.ru/'),'No Yandex script or pixel in development');
   assert.ok(!html.includes('googletagmanager.com/'),'No Google script in development');
  }finally{await server.stop()}
 `;
 const run=spawnSync(process.execPath,['--input-type=module','-e',source],{env:{...process.env,NODE_ENV:'development',PUBLIC_GA_MEASUREMENT_ID:'G-ABC1234567',PUBLIC_YANDEX_METRIKA_ID:'114060319',ASTRO_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:60000});
 assert.equal(run.status,0,`${run.error||''}\n${run.stdout}\n${run.stderr}`);
});
