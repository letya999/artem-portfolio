import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pressCycle,tagMotion,PRACTICE_CYCLE_SECONDS} from './practice-cycle.js';

test('material accumulates before pressing and the formed cube leaves only after the hands reopen',()=>{
 const filling=pressCycle(2),full=pressCycle(20),pressed=pressCycle(22),opening=pressCycle(23.5),leaving=pressCycle(25),landed=pressCycle(26.5);
 assert(filling.fill>0&&filling.fill<1);assert.equal(filling.closure,0);
 assert.equal(full.fill,1);assert.equal(full.travel,0);
 assert.equal(pressed.compression,1);assert.equal(pressed.closure,1);assert.equal(pressed.travel,0);
 assert(opening.closure>0&&opening.closure<1);assert.equal(opening.travel,0);
 assert.equal(leaving.closure,0);assert(leaving.travel>0&&leaving.travel<1);
 assert.equal(landed.travel,1);assert.equal(landed.stage,'settled');
 assert.equal(pressCycle(PRACTICE_CYCLE_SECONDS).cycle,1);assert.equal(pressCycle(PRACTICE_CYCLE_SECONDS).fill,0);
});

test('word curves toward the palm and becomes a cube at the same point the particle starts',()=>{
 const from={x:0,y:0},to={x:200,y:20};
 assert.equal(tagMotion(-.01,from,to),null);
 assert.equal(tagMotion(0,from,to).opacity,0);
 const middle=tagMotion(.8,from,to);
 assert(middle.x>0&&middle.x<200&&middle.y>0);
 const readable=tagMotion(1.4,from,to);
 assert(readable.opacity>.9&&readable.morph<.1);
 const cube=tagMotion(2.8,from,to);
 assert(Math.abs(cube.x-to.x)<1e-8&&Math.abs(cube.y-to.y)<1e-8);
 assert.equal(cube.morph,1);
 assert.equal(tagMotion(3.01,from,to),null);
});

test('the palm fills for twenty seconds, then the delivered cube pauses and exits',()=>{
 assert.equal(pressCycle(19).stage,'collect');
 assert(pressCycle(19).fill<1);
 assert.equal(pressCycle(26.5).stage,'settled');
 assert.equal(pressCycle(26.5).exit,0);
 assert.equal(pressCycle(27.25).stage,'exit');
 assert(pressCycle(27.25).exit>0);
 assert.equal(pressCycle(27.49).stage,'exit');
 assert(pressCycle(27.49).exit>.99);
});

test('the next words start as soon as the previous cube exits',()=>{
 assert.equal(PRACTICE_CYCLE_SECONDS,27.5);
 assert.equal(pressCycle(PRACTICE_CYCLE_SECONDS).stage,'collect');
});
