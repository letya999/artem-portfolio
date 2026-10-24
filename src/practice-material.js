import {Vector3} from 'three';
import data from './practice-hand-data.js';

const surface=data.tiles.filter(t=>t.n[1]>.5&&t.p[0]>-50&&t.p[0]<40);
function palmHeight(x,z){
 const nearest=surface.map(t=>({y:t.p[1]+data.pitch*.5,d:(t.p[0]-x)**2+(t.p[2]-z)**2})).sort((a,b)=>a.d-b.d).slice(0,4);
 const weight=nearest.reduce((sum,t)=>sum+1/(t.d+1),0);
 return nearest.reduce((sum,t)=>sum+t.y/(t.d+1),0)/weight;
}
export function createPalmPile(){
 const size=10.5,pitch=10.7,restPitch=8,spots=[];
 for(let z=0;z<6;z++)for(let x=0;x<6;x++)spots.push([x,z,0]);
 for(let z=1;z<5;z++)for(let x=1;x<5;x++)spots.push([x,z,1]);
 for(let z=1;z<4;z++)for(let x=1;x<4;x++)spots.push([x,z,2]);
 spots.push([2,2,3],[3,2,3],[2,3,3]);
 const packedFloor=Array.from({length:16},(_,i)=>palmHeight(10+(i%4-1.5)*pitch,7+(Math.floor(i/4)-1.5)*pitch));
 const floor=Math.max(...packedFloor);
 const center=new Vector3(10,floor+size/2+1.5*pitch,7);
 const particles=spots.map(([x,z,layer],i)=>{
  const px=8+(x-2.5)*restPitch+Math.sin(i*12.9898)*.45;
  const pz=7+(z-2.5)*restPitch+Math.cos(i*7.23)*.45;
  const packedX=10+(i%4-1.5)*pitch,packedZ=7+(Math.floor(i/4)%4-1.5)*pitch;
  return {arrival:i<48?4+Math.floor(i/3)*.95+(i%3)*.04:4+(i-48)*.85,yaw:Math.sin(i*12.9898)*.4,packedSupport:packedFloor[i%16],
   rest:new Vector3(px,palmHeight(px,pz)+size/2+layer*pitch,pz),
   packed:new Vector3(packedX,floor+size/2+Math.floor(i/16)*pitch,packedZ)};
 });
 return {size,pitch,center,particles,contactHeight:palmHeight(10,7)};
}
// Gravity, one damped contact bounce, then support from the palm or preceding cube.
export function samplePalmParticle(particle,seconds,compression){
 const age=seconds-particle.arrival,gravity=400,height=13,fall=Math.sqrt(2*height/gravity),bounceVelocity=gravity*fall*.16,bounceDuration=2*bounceVelocity/gravity;
 if(age<0)return null;
 if(compression>=1)return particle.packed.clone();
 let lift=Math.max(0,height-gravity*age*age/2);
 if(age>fall&&age<fall+bounceDuration){const t=age-fall;lift=bounceVelocity*t-gravity*t*t/2;}
 const point=new Vector3(particle.rest.x,particle.rest.y+lift,particle.rest.z);
 return point.lerp(particle.packed,compression);
}
