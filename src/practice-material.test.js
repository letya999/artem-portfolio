import test from 'node:test';
import assert from 'node:assert/strict';
import {createPalmPile,samplePalmParticle} from './practice-material.js';

test('arriving cubes fall, bounce without crossing their support, and settle on the palm or previous layer',()=>{
 const pile=createPalmPile();assert.equal(pile.particles.length,64);
 assert.equal(pile.size,10.5);assert.ok(pile.particles.at(-1).arrival<10);
 assert.equal(new Set(pile.particles.slice(0,36).map(p=>p.rest.x.toFixed(1)+','+p.rest.z.toFixed(1))).size,36);
 assert.ok(pile.particles[63].rest.y>pile.particles[0].rest.y);
 for(const [i,particle] of pile.particles.entries()){
  assert.equal(samplePalmParticle(particle,particle.arrival-.01,0),null);
  assert.ok(Math.abs(samplePalmParticle(particle,particle.arrival,0).y-particle.rest.y-13)<1e-8);
  assert.equal(samplePalmParticle(particle,particle.arrival,0).x,particle.rest.x);
  assert.ok(Math.abs(samplePalmParticle(particle,particle.arrival+.1,0).y-particle.rest.y-11)<1e-8);
  for(let age=0;age<1;age+=.01)assert.ok(samplePalmParticle(particle,particle.arrival+age,0).y>=particle.rest.y-1e-8);
  assert.ok(samplePalmParticle(particle,particle.arrival+.3,0).y>particle.rest.y);
  assert.ok(samplePalmParticle(particle,particle.arrival+.6,0).distanceTo(particle.rest)<1e-8);

 }
});

test('pressing keeps every cube and aligns one supported four-by-four-by-four product',()=>{
 const pile=createPalmPile();
 const packed=pile.particles.map(p=>samplePalmParticle(p,13.5,1));
 assert.equal(new Set(packed.map(p=>p.toArray().join(','))).size,64);
 for(const axis of ['x','y','z']){
  const levels=[...new Set(packed.map(p=>p[axis]))].sort((a,b)=>a-b);assert.equal(levels.length,4);
  for(let i=1;i<4;i++)assert.ok(Math.abs(levels[i]-levels[i-1]-pile.pitch)<1e-8);
 }
 for(let i=0;i<64;i++){
  if(i<16)assert.ok(packed[i].y-pile.size/2>=pile.particles[i].packedSupport-1e-8);
  assert.ok(samplePalmParticle(pile.particles[i],13.3,1).distanceTo(packed[i])<1e-8);
 }
});
