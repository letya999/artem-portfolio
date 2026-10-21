import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeIdentityPortrait} from './identity-portrait.js';
const data=JSON.parse(readFileSync(new URL('../public/portrait-tiles.json',import.meta.url)));
test('measured face retains full depth, closed bevelled tiles and finite normals',()=>{
 const model=makeIdentityPortrait(data);
 assert.equal(model.userData.tileCount,data.tileCount);
 assert.ok(data.landmarkDepthRMSE<.025);
 assert.equal(data.landmarks,468);
 let triangles=0;
 for(const layer of model.children){
  const p=layer.geometry.attributes.position.array,n=layer.geometry.attributes.normal.array;
  assert.ok([...p,...n].every(Number.isFinite));
  assert.equal(layer.material.map,null);
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
