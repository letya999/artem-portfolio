import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeVoxelPortrait, poseVoxelPortrait } from './voxel.js';
import { Matrix4, Vector3, Raycaster, Quaternion } from 'three';
const data = JSON.parse(readFileSync(new URL('../public/voxel-portrait.json',import.meta.url)));
test('voxel integration preserves every solid cube and its full-depth transform',()=>{
 const model=makeVoxelPortrait(data), matrix=new Matrix4();
 assert.equal(model.children.reduce((n,m)=>n+m.count,0),data.count);
 model.traverse(o=>{if(o.isMesh)assert.ok(o.isInstancedMesh,'All portrait surfaces must consist of cubes, without smooth inserts');});
 assert.ok(data.count>=2852*2 && data.count<=60000);
 assert.ok(data.cubeSize<.07245 && data.pitch<=.05);
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
 model.children.forEach(b=>b.geometry.dispose());model.children[0].material.dispose();
});
test('malformed voxel payload fails safely',()=>{
 assert.throws(()=>makeVoxelPortrait({...data,count:0}));
 assert.throws(()=>makeVoxelPortrait({...data,cubes:[{position:[NaN,0,0]}],count:1}));
 assert.throws(()=>makeVoxelPortrait({...data,pitch:Infinity}));
 assert.throws(()=>makeVoxelPortrait({...data,cubes:[{...data.cubes[0],motion:Infinity}],count:1}));
 assert.throws(()=>makeVoxelPortrait({...data,cubes:[{...data.cubes[0],normal:[NaN,0,1]}],count:1}));
});

test('the resting portrait raises its chin slightly without rolling the head',()=>{
 const model=makeVoxelPortrait(data);
 model.updateMatrixWorld(true);
 const direction=new Vector3(0,0,1).transformDirection(model.children.at(-1).matrixWorld);
 assert.ok(direction.y>.06&&direction.y<.14,'Resting chin must be raised by a few degrees');
 assert.equal(model.rotation.z,0);
 assert.equal(model.userData.restPitch,model.children.at(-1).rotation.x);
 model.children.forEach(b=>b.geometry.dispose());model.children[0].material.dispose();
});

test('raising the head leaves the neck base horizontal and rooted',()=>{
 const model=makeVoxelPortrait(data),base=model.children[0];
 model.updateMatrixWorld(true);
 const a=new Vector3(-.4,0,-.32).applyMatrix4(base.matrixWorld);
 const b=new Vector3(.4,0,.08).applyMatrix4(base.matrixWorld);
 assert.ok(Math.abs(a.y-b.y)<1e-6,'Chin elevation must not tilt the neck cap');
 assert.ok(Math.abs(base.matrixWorld.elements[13]-base.userData.restY)<1e-6,'Base must stay at its original height');
 model.children.forEach(b=>b.geometry.dispose());model.children[0].material.dispose();
});

test('the front of the articulated neck has no see-through gaps when the chin rises',()=>{
 const model=makeVoxelPortrait(data),centerY=(data.bounds.min[1]+data.bounds.max[1])/2;
 const neck=model.children.filter(b=>b.userData.restY+centerY>=.46&&b.userData.restY+centerY<=.74);
 const ray=new Raycaster(),normal=new Vector3(),surface=new Vector3(),next=new Vector3(),q=new Quaternion();
 const gaps=[];
 for(const pitch of [-.48,-.10,.32])for(const yaw of [-.95,0,.95]){
  model.userData.headRotation.set(pitch,yaw,0);poseVoxelPortrait(model,model.userData.headRotation);model.updateMatrixWorld(true);
  for(let i=0;i<neck.length-1;i++){
   const a=neck[i],b=neck[i+1];
   for(const [layer,out] of [[a,surface],[b,next]]){
    const y=layer.userData.restY+centerY;
    const depth=y<=.56?.43+(y-.38)/(.56-.38)*(.40-.43):.40+(y-.56)/(.78-.56)*(.36-.40);
    out.set(0,0,-.32+depth).applyMatrix4(layer.matrixWorld);
   }
   surface.lerp(next,.5);q.copy(a.quaternion).slerp(b.quaternion,.5);
   normal.set(0,0,1).applyQuaternion(q);ray.set(surface.clone().addScaledVector(normal,.30),normal.clone().negate());
   const hit=ray.intersectObject(model,true).find(hit=>hit.object.isInstancedMesh);
   if(!hit||hit.distance>.35)gaps.push({pitch,yaw,row:i,distance:hit?.distance});
  }
 }
 assert.deepEqual(gaps,[],'Neck surface must stay within one cube of its bent front contour');
 model.traverse(o=>o.geometry?.dispose());model.children[0].material.dispose();
});

test('the head can look upward while fully turned to the side',()=>{
 const model=makeVoxelPortrait(data);
 model.userData.headRotation.set(-.55,1.05,0);
 poseVoxelPortrait(model,model.userData.headRotation);
 const skull=model.children.at(-1);
 const direction=new Vector3(0,0,1).applyQuaternion(skull.quaternion);
 assert.ok(direction.y>.50,'Turning sideways must preserve the upward gaze angle');
 const jawRows=new Set(data.cubes.filter(c=>c.region==='jaw'&&c.position[2]>.18).map(c=>Math.round(c.position[1]/data.pitch)));
 const centerY=(data.bounds.min[1]+data.bounds.max[1])/2;
 for(const band of model.children)if(jawRows.has(Math.round((band.userData.restY+centerY)/data.pitch))){
  assert.ok(band.quaternion.angleTo(skull.quaternion)<1e-6,'The jaw must rotate rigidly with the skull, not bend with the neck');
 }
 model.children.forEach(b=>b.geometry.dispose());model.children[0].material.dispose();
});


test('the rendered lattice encloses the left temple and head core without a hole',()=>{
 const cells=data.cubes.map(c=>{
  assert.deepEqual(c.quaternion,[0,0,0,1]);
  const cell=[c.position[0]/data.pitch,c.position[1]/data.pitch-.5,c.position[2]/data.pitch].map(Math.round);
  assert.ok(cell.every((v,i)=>Math.abs((c.position[i]/data.pitch-(i===1?.5:0))-v)<1e-4));
  return cell;
 });
 assert.equal(new Set(cells.map(c=>c.join(","))).size,data.count,"Cube positions must be unique");
 const min=[0,1,2].map(i=>Math.min(...cells.map(c=>c[i]))-2);
 const max=[0,1,2].map(i=>Math.max(...cells.map(c=>c[i]))+2);
 const size=max.map((v,i)=>v-min[i]+1),[nx,ny,nz]=size;
 const index=(x,y,z)=>((x-min[0])*ny+y-min[1])*nz+z-min[2];
 const occupied=new Uint8Array(nx*ny*nz),outside=new Uint8Array(occupied.length),queue=new Int32Array(occupied.length);
 cells.forEach(c=>occupied[index(...c)]=1);
 let head=0,tail=1;queue[0]=0;outside[0]=1;
 while(head<tail){
  const current=queue[head++],z=current%nz,y=Math.floor(current/nz)%ny,x=Math.floor(current/(ny*nz));
  const candidates=[];
  if(x>0)candidates.push(current-ny*nz);if(x<nx-1)candidates.push(current+ny*nz);
  if(y>0)candidates.push(current-nz);if(y<ny-1)candidates.push(current+nz);
  if(z>0)candidates.push(current-1);if(z<nz-1)candidates.push(current+1);
  for(const next of candidates)if(!occupied[next]&&!outside[next]){outside[next]=1;queue[tail++]=next;}
 }
 for(const [x,y,z] of [[-.35,1.85,0],[0,1.90,-.30]]){
  const core=index(Math.round(x/data.pitch),Math.round(y/data.pitch-.5),Math.round(z/data.pitch));
  assert.equal(occupied[core],1,'The interior must be filled with cubes');
  assert.equal(outside[core],0,'Exterior air must not reach the head interior');
 }
 assert.equal(occupied.filter((value,i)=>!value&&!outside[i]).length,0,'No enclosed empty voxel may remain inside the head or neck');
});


test('scan jaw has no oversized template arc and ears stay within captured height',()=>{
 const jaw=data.cubes.filter(c=>c.position[1]>=.76&&c.position[1]<.90&&c.position[2]>.18);
 assert.ok(jaw.length>10);
 assert.ok(jaw.every(c=>Math.abs(c.position[0])<=.30),'Lower jaw must follow the narrow measured chin');
 for(const side of [-1,1]){
  const ear=data.cubes.filter(c=>c.position[0]*side>.72&&c.position[1]>1.2&&c.position[1]<2.3);
  assert.ok(ear.length>10);
  assert.ok(ear.every(c=>c.position[1]>=1.58&&c.position[1]<=2.06),'Exposed ears must match the captured ear position');
 }
});


test('short broad neck replaces the shoulders without deforming the face features',()=>{
 const pupils=data.cubes.filter(c=>c.feature==='pupil');
 assert.equal(pupils.length,2);
 assert.ok(pupils.some(c=>c.position[0]<-.2)&&pupils.some(c=>c.position[0]>.2));
 assert.ok(data.cubes.filter(c=>c.feature==='lip-seam').length>=4);
 assert.ok(data.cubes.filter(c=>c.feature==='lip').length>=10);
 assert.equal(data.cubes.filter(c=>c.region==='shoulder').length,0,'No shoulder shell may remain');
 const neck=data.cubes.filter(c=>c.position[1]<.70);
 assert.ok(neck.length>50);
 assert.ok(neck.every(c=>Math.abs(c.position[0])<=.58&&c.position[1]>=.15),'Only the short neck may remain below the head');
 const profile=neck.filter(c=>c.position[1]>=.46&&c.position[1]<=.58&&Math.abs(c.position[0])<.08);
 assert.ok(profile.length>10);
 const depth=Math.max(...profile.map(c=>c.position[2]))-Math.min(...profile.map(c=>c.position[2]));
 assert.deepEqual({broader:neck.some(c=>Math.abs(c.position[0])>=.52),deeper:depth>=.80-1e-6},{broader:true,deeper:true});
 const model=makeVoxelPortrait(data);
 let pupilInstances=0,movingInstances=0;
 for(const band of model.children){
  const pupil=band.geometry.attributes.instancePupil,motion=band.geometry.attributes.instanceMotion;
  assert.equal(pupil.count,band.count);assert.equal(motion.count,band.count);
  pupilInstances+=[...pupil.array].filter(v=>v===1).length;
  for(let i=0;i<motion.count;i++)if(motion.getX(i)>0)movingInstances++;
  band.geometry.dispose();
 }
 assert.equal(pupilInstances,2);assert.equal(movingInstances,0);
 model.children[0].material.dispose();
});

test('the closed neck base is horizontal in every quadrant without a moving fringe',()=>{
 const neck=data.cubes.filter(c=>c.position[1]<.70);
 assert.ok(neck.length>50);
 const bottom=Math.min(...neck.map(c=>c.position[1]));
 const quadrants=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>
  Math.min(...neck.filter(c=>c.position[0]*sx>.25&&(c.position[2]+.30)*sz>0).map(c=>c.position[1])));
 assert.deepEqual({
  baseHeights:quadrants,
  fringe:data.cubes.some(c=>c.region==='neck-edge'),
  moving:data.cubes.some(c=>(c.motion??0)>0),
 },{baseHeights:Array(4).fill(bottom),fringe:false,moving:false});
});

test('neck is slightly shorter with a straight axis and a gentle taper below the jaw',()=>{
 const row=y=>data.cubes.filter(c=>Math.abs(c.position[1]-y)<1e-6);
 const width=cubes=>Math.max(...cubes.map(c=>c.position[0]))-Math.min(...cubes.map(c=>c.position[0]));
 const profile=cubes=>{
  const center=cubes.filter(c=>Math.abs(c.position[0])<.08);
  assert.ok(center.length>5);
  const front=Math.max(...center.map(c=>c.position[2])),back=Math.min(...center.map(c=>c.position[2]));
  return {center:(front+back)/2,depth:front-back};
 };
 const lower=row(.42),upper=row(.66),a=profile(lower),b=profile(upper);
 const bottom=Math.min(...data.cubes.map(c=>c.position[1]));
 assert.deepEqual({
  shorter:bottom>=.37&&bottom<=.43,
  tapered:width(lower)-width(upper)>=data.pitch*2-1e-6,
  straight:Math.abs(a.center-b.center)<data.pitch/4,
  lowerProfile:a.depth<=.80+1e-6,
  upperProfile:b.depth>=.68&&b.depth<=.72+1e-6,
 },{shorter:true,tapered:true,straight:true,lowerProfile:true,upperProfile:true});
});

test('eyes and lips share the same light steel palette as all other cubes',()=>{
 const model=makeVoxelPortrait(data);
 for(const band of model.children){
  for(let i=0;i<band.count;i++){
   const [r,g,b]=[0,1,2].map(c=>band.instanceColor.array[i*3+c]);
   assert.ok(r>=.60&&r<=.76,'No dark pupil or lip inserts');
   assert.equal(r,g);assert.equal(g,b);
  }
  band.geometry.dispose();
 }
 model.children[0].material.dispose();
});

test('cube fronts retain a square face and a visible bevel rim',()=>{
 const front=data.geometry.positions.filter((p,i)=>data.geometry.normals[i][2]>.999);
 const width=Math.max(...front.map(p=>p[0]))-Math.min(...front.map(p=>p[0]));
 assert.ok(width>=.90&&width<=.94,'Flat faces must leave a visible bevel around each cube');
 assert.ok(Math.abs(Math.max(...data.geometry.positions.map(p=>p[0]))-.5)<1e-6,'Bevel must retain full cube size');
});

test('eyelids and brows have local expression weights without deforming the back or neck',()=>{
 const model=makeVoxelPortrait(data),totals=[0,0,0,0],matrix=new Matrix4(),point=new Vector3();
 for(const band of model.children){
  const face=band.geometry.attributes.instanceFace;
  assert.ok(face,'Eye and brow regions need independent expression controls');
  assert.equal(face.count,band.count);
  for(let i=0;i<band.count;i++){
   band.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);point.y+=band.userData.restY+(data.bounds.min[1]+data.bounds.max[1])/2;
   for(let axis=0;axis<4;axis++){
    const weight=face.array[i*4+axis];assert.ok(weight>=0&&weight<=1);totals[axis]+=weight;
    if(point.z<.4||point.y<1.5)assert.equal(weight,0,'Expressions must leave the neck and rear skull untouched');
   }
  }
  band.geometry.dispose();
 }
 assert.ok(totals.every(n=>n>1),'Both lids, brows and pupils must be represented');
 model.children[0].material.dispose();
});
