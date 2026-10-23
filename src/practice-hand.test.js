import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Matrix3,Matrix4} from 'three';
import {OBB} from 'three/addons/math/OBB.js';
import {createHandPose} from './practice-hand.js';
import handData from './practice-hand-data.js';

test('hand poses retain tiles while articulating all five digits',()=>{
  for(const role of ['upper','lower']){
    const open=createHandPose(role,0),closed=createHandPose(role,1);
    assert.equal(open.tiles.length,closed.tiles.length);
    assert.deepEqual(open.indices,closed.indices);
    assert.equal(open.vertices.length,closed.vertices.length);
    assert.ok(open.tiles.length>400&&open.tiles.length<2000);
    for(const part of ['thumb','finger-0','finger-1','finger-2','finger-3']){
      const indices=open.tiles.flatMap((tile,i)=>tile.part===part?[i]:[]);
      assert.ok(indices.some(i=>open.tiles[i].position.distanceTo(closed.tiles[i].position)>8),part);
    }
    for(const tile of [...open.tiles,...closed.tiles]){
      assert.ok([...tile.position,...tile.quaternion,...tile.scale].every(Number.isFinite));
      assert.ok(Math.abs(tile.quaternion.length()-1)<1e-6);
      assert.ok(tile.scale.x>0&&tile.scale.z>0);
      assert.equal(tile.scale.x,tile.scale.y);
      assert.equal(tile.scale.x,tile.scale.z);
    }
  }
});
test('opposing palms are rotated, with their normals facing each other',()=>{
  const lower=createHandPose('lower'),upper=createHandPose('upper');
  for(const i of lower.tiles.flatMap((tile,i)=>tile.part==='palm'?[i]:[])){
    assert.ok(Math.abs(lower.tiles[i].position.x-upper.tiles[i].position.x)<1e-6);
    assert.ok(Math.abs(lower.tiles[i].position.y+upper.tiles[i].position.y)<1e-6);
    assert.ok(Math.abs(lower.tiles[i].position.z+upper.tiles[i].position.z)<1e-6);
  }
});

test('open fingertips have clearance between their outer cube shells',()=>{
  const tiles=createHandPose('lower').tiles;
  const tips=Array.from({length:4},(_,finger)=>{
    const distal=8+finger*5;
    const digit=tiles.filter((_,i)=>handData.tiles[i].j[0]===distal||handData.tiles[i].j[0]===distal+1);
    assert.ok(digit.length>0);
    return digit.map(t=>new OBB(t.position,t.scale.clone().multiplyScalar(.5),new Matrix3().setFromMatrix4(new Matrix4().makeRotationFromQuaternion(t.quaternion))));
  });
  for(let i=1;i<tips.length;i++)for(const a of tips[i-1])for(const b of tips[i]){
    assert.ok(!a.intersectsOBB(b),`digits ${i-1} and ${i} overlap`);
  }
});

test('curved fingers and the opposing thumb cup the receiving palm',()=>{
  const tiles=createHandPose('lower').tiles;
  const center=tiles.filter(t=>t.part==='palm'&&t.position.x>0&&t.position.x<15&&t.position.z>0&&t.position.z<15);
  assert.ok(center.length>0);
  const palmTop=Math.max(...center.map(t=>t.position.y));
  for(const part of ['thumb','finger-0','finger-1','finger-2','finger-3']){
    const digit=tiles.filter(t=>t.part===part);
    assert.ok(digit.length>0);
    assert.ok(Math.max(...digit.map(t=>t.position.y))>palmTop+10,part);
  }
});
