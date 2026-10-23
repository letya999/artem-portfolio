import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {areas} from './practice-data.js';

test('practice vocabularies cover the stated experience in all three fields',()=>{
 for(const area of areas){assert.equal(area.length-1,64);assert.equal(new Set(area.slice(1)).size,64);}
  assert.equal(areas.length,3);
  for(const area of areas)assert.ok(area.length>=33,`${area[0]} has too few terms`);
  for(const term of ['Data Engineering','MS SQL','Data Lake','Power BI','Airflow','Angular','React','Rust','Flutter','Dart','Android','PostgreSQL','ClickHouse','ETL / ELT','DataLens','Dagster','Go','Tauri','Observability','Microservices','AI Agents'])
    assert.ok(areas[1].includes(term),`missing ${term}`);
  for(const term of ['PMBoK','P3.express','RTE','Lead Time','Cycle Time','Capacity','Stakeholders','Facilitation','Coaching','Portfolio','Prioritization','AI-native SDLC','Performance Review'])assert.ok(areas[0].includes(term));
  for(const term of ['Product Discovery','JTBD','MVP','Unit Economics','Monetization','Funnels','Cohorts','Activation','Churn','LTV','CAC','Segmentation','North Star','Go-to-Market','Experimentation','Product Analytics','AppMetrica'])assert.ok(areas[2].includes(term));
});
