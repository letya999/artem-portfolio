import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeVoxelPortrait } from './voxel.js';
import { Matrix4 } from 'three';
const data = JSON.parse(readFileSync(new URL('../public/voxel-portrait.json',import.meta.url)));
test('voxel integration preserves every solid cube and its full-depth transform',()=>{
 const model=makeVoxelPortrait(data), matrix=new Matrix4();
 assert.equal(model.children.reduce((n,m)=>n+m.count,0),data.count);
 assert.ok(data.count>4000);
 assert.ok(data.bounds.max[2]-data.bounds.min[2]>1.5);
 for(const band of model.children){
  assert.equal(band.material.map,null);
  assert.equal(band.material.metalness,1);
  for(let i=0;i<band.count;i++){
   band.getMatrixAt(i,matrix);
   assert.ok(matrix.elements.every(Number.isFinite));
   assert.ok(matrix.determinant()>0);
  }
 }
 model.children[0].geometry.dispose();model.children[0].material.dispose();
});
test('malformed voxel payload fails safely',()=>{
 assert.throws(()=>makeVoxelPortrait({...data,count:0}));
 assert.throws(()=>makeVoxelPortrait({...data,cubes:[{position:[NaN,0,0]}],count:1}));
});
