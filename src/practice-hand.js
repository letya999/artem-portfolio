import * as THREE from 'three';
import data from './practice-hand-data.js';

const v=(p)=>new THREE.Vector3().fromArray(p),zAxis=new THREE.Vector3(0,0,1),yAxis=new THREE.Vector3(0,1,0);
const rest=data.joints.map(j=>v(j.p));
const mix=THREE.MathUtils.lerp;
// Both poses use the same anatomical surface and articulated skeleton.
export function createHandPose(role='lower',grip=0){
 const positions=rest.map(p=>p.clone()),rotations=rest.map(()=>new THREE.Quaternion());
 function chain(ids,angles){
  for(let i=0;i<ids.length;i++){
   const id=ids[i];
   if(i){const parent=ids[i-1];positions[id].copy(rest[id]).sub(rest[parent]).applyQuaternion(rotations[parent]).add(positions[parent]);rotations[id].copy(rotations[parent]);}
   if(angles[i])rotations[id].multiply(new THREE.Quaternion().setFromAxisAngle(zAxis,angles[i]));
  }
 }
 for(let finger=0;finger<4;finger++){
  const first=6+finger*5;
  rotations[first].setFromAxisAngle(yAxis,(1.5-finger)*.07*(1-grip*.8));
  const open=[.25,.75,.45];
  const closed=role==='upper'?[.45,.85,.60]:[.38,.85,.50];
  chain([first,first+1,first+2,first+3],open.map((a,i)=>mix(a,closed[i],grip)).concat(0));
 }
 rotations[1].setFromAxisAngle(yAxis,mix(.03,role==='upper'?-.48:-.25,grip)).multiply(new THREE.Quaternion().setFromAxisAngle(zAxis,-.25));
 chain([1,2,3,4],[0,mix(0,role==='upper'?-.30:-.10,grip),mix(.06,-.18,grip),0]);
 const matrices=positions.map((p,i)=>new THREE.Matrix4().compose(p,rotations[i],new THREE.Vector3(1,1,1)).multiply(new THREE.Matrix4().makeTranslation(-rest[i].x,-rest[i].y,-rest[i].z)));
 const flip=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),role==='upper'?Math.PI:0);
 const scratch=new THREE.Vector3();
 function deform(point,ids,weights){
  const out=new THREE.Vector3();for(let i=0;i<ids.length;i++)out.addScaledVector(scratch.copy(point).applyMatrix4(matrices[ids[i]]),weights[i]);
  return out.applyQuaternion(flip);
 }
 const tiles=data.tiles.map(tile=>{
  const quaternion=new THREE.Quaternion(0,0,0,0),normal=new THREE.Vector3();
  for(let i=0;i<tile.j.length;i++){
   const q=rotations[tile.j[i]],w=tile.w[i];quaternion.x+=q.x*w;quaternion.y+=q.y*w;quaternion.z+=q.z*w;quaternion.w+=q.w*w;
   normal.addScaledVector(v(tile.n).applyQuaternion(q),w);
  }
  quaternion.normalize().multiply(new THREE.Quaternion().fromArray(tile.q)).premultiply(flip).normalize();normal.normalize().applyQuaternion(flip);
  const joint=tile.j[0];
  const part=joint>=1&&joint<=4?'thumb':joint>=6&&(joint-5)%5!==0?`finger-${Math.floor((joint-5)/5)}`:'palm';
  return {part,position:deform(v(tile.p),tile.j,tile.w),quaternion,normal,scale:new THREE.Vector3().setScalar(data.pitch*.98)};
 });
 const vertices=new Float32Array(data.positions.length);
 for(let i=0;i<data.positions.length/3;i++)deform(v(data.positions.slice(i*3,i*3+3)),data.skinJoints[i],data.skinWeights[i]).toArray(vertices,i*3);
 return {tiles,vertices,indices:data.indices};
}
