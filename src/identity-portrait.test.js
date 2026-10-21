import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeIdentityPortrait} from './identity-portrait.js';
const data=JSON.parse(readFileSync(new URL('../public/portrait-tiles.json',import.meta.url)));
test('scanned bust retains full depth, closed bevelled tiles and finite normals',()=>{
 const model=makeIdentityPortrait(data);
 assert.equal(model.userData.tileCount,data.tileCount);
 const points=data.bands.flatMap(b=>b.quads.flat());
 const depths=points.filter((_,i)=>i%3===2);
 const heights=points.filter((_,i)=>i%3===1);
 assert.ok(Math.max(...depths)-Math.min(...depths)>.8, 'Bust must retain volumetric depth');
 assert.ok(Math.max(...heights)-Math.min(...heights)>2.9, 'Bust must retain head, neck and base');
 let triangles=0;
 for(const layer of model.children){
  const p=layer.geometry.attributes.position.array,n=layer.geometry.attributes.normal.array;
  assert.ok([...p,...n].every(Number.isFinite));
  assert.equal(layer.material.map,null);
  const features=layer.geometry.attributes.portraitFeature;
  assert.equal(features.count,p.length/3);
  assert.ok([...features.array].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  triangles+=p.length/9;
  layer.geometry.dispose();
 }
 assert.equal(triangles,data.tileCount*20);
 model.children[0].material.dispose();
});
test('incomplete or nonfinite tile data is rejected before mesh allocation',()=>{
 assert.throws(()=>makeIdentityPortrait({...data,tileCount:-1}));
 assert.throws(()=>makeIdentityPortrait({...data,bands:[{y:0,quads:[[NaN]]}]}));
});
