import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as sculpture from './matryoshka.js';

test('career dolls have complete hollow voxel shells, an ivory face with eyes and lips, a scarf and floral apron', () => {
  const dolls = sculpture.makeMatryoshkas?.(new THREE.BoxGeometry(1,1,1));
  const colors = dolls?.instanceColor;
  const palette = new Set();
  if (colors) for (let i=0;i<colors.count;i++) palette.add(new THREE.Color().fromBufferAttribute(colors,i).getHex());
  const expected = {face:0xe4d5b6,eyes:0x263d46,lips:0xa85c50,hair:0x9d885e,scarf:0x35474a,apron:0x677a67,petals:0xb8c77f,flowerCenters:0xd5bd78,seam:0xb3a16e,innerRim:0x96855e};
  const missing = Object.entries(expected).filter(([,color])=>!palette.has(color)).map(([feature])=>feature);
  assert.deepEqual(missing, [], 'Recognizable matryoshkas need the supplied face, scarf, floral apron and hollow seam details');
  assert.ok(dolls.count>5000 && dolls.count<16000);
  const parts=dolls.geometry.attributes.dollPart;
  assert.ok(parts.array.some((v,i)=>i%2===1&&v===1), 'The upper shell must be independently movable');
  assert.ok(parts.array.some((v,i)=>i%2===1&&v===0), 'The lower bowl must remain grounded');
});

test('ordinary scrolling translates the shared doll mesh without rewriting thousands of instance matrices', () => {
  const dolls=sculpture.makeMatryoshkas(new THREE.BoxGeometry(1,1,1));
  const rows=Array.from({length:6},(_,i)=>({x:1,y:-i*2,width:2,height:1.5}));
  dolls.userData.layout(rows);
  const version=dolls.instanceMatrix.version,original=dolls.instanceMatrix.array.slice();
  dolls.userData.layout(rows.map(row=>({...row,y:row.y+.3})));
  assert.equal(dolls.instanceMatrix.version,version,'Scrolling alone must not upload the entire shell geometry again');
  assert.deepEqual(dolls.instanceMatrix.array,original);
  assert.ok(Math.abs(dolls.position.y-.3)<1e-6);
});

test('a complete doll has a solid lower base and occupies most of its reserved height',()=>{
  const dolls=sculpture.makeMatryoshkas(new THREE.BoxGeometry(1,1,1));
  dolls.userData.layout(Array.from({length:6},(_,i)=>({x:0,y:-i*4,width:4,height:3.2})));
  const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),points=[];
  for(let i=0;i<dolls.count/6;i++){dolls.getMatrixAt(i,matrix);points.push(p.setFromMatrixPosition(matrix).clone());}
  const min=Math.min(...points.map(p=>p.y)),max=Math.max(...points.map(p=>p.y));
  const failures=[];
  if(!points.some(p=>Math.abs(p.x)<.1&&Math.abs(p.z)<.1&&p.y<min+.15))failures.push('The bottom bowl needs a solid central base instead of an open hole');
  if(max-min<2.1)failures.push('The largest complete shell should occupy at least two thirds of its reserved height');
  assert.deepEqual(failures,[]);
});
