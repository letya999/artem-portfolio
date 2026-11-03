import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conveyorPose} from './conveyor-motion.js';
test('five marks occupy five evenly spaced phases, including across the wrap',()=>{
 for(const distance of [0,7,14,28]){
  const x=Array.from({length:5},(_,i)=>conveyorPose(distance,i,12).x).sort((a,b)=>a-b);
  const gaps=x.map((v,i)=>(i===4?x[0]+15:x[i+1])-v);
  for(const gap of gaps)assert.ok(Math.abs(gap-3)<1e-9,`An empty sixth slot must not leave an enlarged gap: ${gaps}`);
 }
 assert.equal(conveyorPose(15,0,12).x,conveyorPose(0,0,12).x);
 assert.ok(conveyorPose(13,0,12).y<0,'The outlet still drops a mark');
});
