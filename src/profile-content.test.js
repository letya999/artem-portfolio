import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as profile from './portfolio-data.js';
import {resumeMarkdown} from './resume.js';
import * as practice from './practice-data.js';
import messages from './messages.json' with {type:'json'};

test('each employer has five results, five responsibilities and concrete projects',()=>{
 assert.equal(profile.jobs.length,6);
 for(const [company,,,scope,results,responsibilities,projects] of profile.jobs){
  assert.equal(results.length,5,`${company}: five results`);
  assert.equal(responsibilities?.length,5,`${company}: five responsibilities`);
  assert.ok(scope.length>40,`${company}: context`);
  assert.ok(projects?.length>40,`${company}: project descriptions`);
 }
 assert.equal(profile.achievements?.length,7,'seven major cross-career cases');
});

test('Kazakh resume translates the professional title',()=>{
 const text=resumeMarkdown(value=>value==='Tech Project Manager'?'Техникалық жобалар менеджері':value);
 assert.ok(text.startsWith('# Артем Летюшев\n\nТехникалық жобалар менеджері\n'));
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
