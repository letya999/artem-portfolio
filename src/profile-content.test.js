import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as profile from './portfolio-data.js';
import {resumeMarkdown} from './resume.js';
import * as practice from './practice-data.js';
import messages from './messages.json' with {type:'json'};
import {readFileSync,readdirSync} from 'node:fs';

test('each employer has five results, five responsibilities and concrete projects',()=>{
 assert.equal(profile.jobs.length,6);
 for(const [company,,,scope,results,responsibilities,projects] of profile.jobs){
  assert.equal(results.length,5,`${company}: five results`);
  assert.equal(responsibilities?.length,5,`${company}: five responsibilities`);
  assert.ok(scope.length>40,`${company}: context`);
  assert.ok(projects?.length>40,`${company}: project descriptions`);
 }
 assert.equal(profile.achievements?.length,6,'six measured outcomes');
});

test('Kazakh resume translates the professional title',()=>{
 const text=resumeMarkdown(value=>messages[value]?.kk??value);
 assert.ok(text.startsWith('# Артем Летюшев\n\nIT жобаларының жетекшісі\n'));
});

test('the sourced $800K annual antifraud impact stays an estimate in every language',()=>{
 for(const source of [profile.achievements[0][2],profile.jobs[0][4][0]])
  for(const [locale,qualification] of [['ru',/Оценочный (?:экономический )?эффект — \$800 тыс\. в год/],['en',/Estimated (?:economic )?impact: \$800K per year/],['kk',/Болжамды (?:экономикалық )?әсер — жылына \$800 мың/]]){
   assert.match(messages[source][locale],qualification,`${locale}: do not present a modelled impact as realized savings`);
  }
});

test('profile and practice copy have complete RU, EN and KK translations',()=>{
 const used=[];
 const visit=value=>{
  if(typeof value==='string'&&/[А-Яа-яЁё]/.test(value))used.push(value);
  else if(Array.isArray(value))value.forEach(visit);
  else if(value&&typeof value==='object')Object.values(value).forEach(visit);
 };
 visit(profile);visit(practice);
 for(const text of used){
  assert.ok(messages[text],`Missing translation key: ${text}`);
  for(const locale of ['ru','en','kk'])assert.ok(messages[text][locale]?.trim(),`${locale}: ${text}`);
 }
});

test('Russian interface strings have real English and Kazakh translations',()=>{
 for(const file of readdirSync(new URL('.',import.meta.url),{recursive:true}).filter(name=>/\.(astro|jsx)$/.test(name))){
  const source=readFileSync(new URL(file.replaceAll('\\','/'),import.meta.url),'utf8');
  for(const [, ,text] of source.matchAll(/\bt\(\s*(['"])(.*?)\1/g))if(/[а-яё]/i.test(text)){
   for(const locale of ['ru','en','kk'])assert.ok(messages[text]?.[locale]?.trim(),`${file} ${locale}: ${text}`);
   assert.ok(!/[а-яё]/i.test(messages[text].en),`Russian text in English UI: ${text}`);
  }
 }
});
