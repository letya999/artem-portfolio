import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeVoxelPortrait } from './voxel.js';
import { Matrix4, Vector3 } from 'three';
const data = JSON.parse(readFileSync(new URL('../public/voxel-portrait.json',import.meta.url)));
test('voxel integration preserves every solid cube and its full-depth transform',()=>{
 const model=makeVoxelPortrait(data), matrix=new Matrix4();
 assert.equal(model.children.reduce((n,m)=>n+m.count,0),data.count);
 assert.ok(data.count>=2852*2 && data.count<=20000);
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
 assert.ok(model.rotation.x<-.06&&model.rotation.x>-.14,'Resting chin must be raised by a few degrees');
 assert.equal(model.rotation.z,0);
 assert.equal(model.userData.restPitch,model.rotation.x);
 model.children.forEach(b=>b.geometry.dispose());model.children[0].material.dispose();
});

test('the head can look upward while fully turned to the side',()=>{
 const model=makeVoxelPortrait(data);
 model.rotation.set(-.55,1.05,0);
 const direction=new Vector3(0,0,1).applyQuaternion(model.quaternion);
 assert.ok(direction.y>.50,'Turning sideways must preserve the upward gaze angle');
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
  assert.equal(occupied[core],0,'Probe must lie inside the hollow core');
  assert.equal(outside[core],0,'Exterior air must not reach the head interior');
 }
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


test('short oblique neck replaces the shoulders and only its sparse edge moves',()=>{
 const pupils=data.cubes.filter(c=>c.feature==='pupil');
 assert.equal(pupils.length,2);
 assert.ok(pupils.some(c=>c.position[0]<-.2)&&pupils.some(c=>c.position[0]>.2));
 assert.ok(data.cubes.filter(c=>c.feature==='lip-seam').length>=4);
 assert.ok(data.cubes.filter(c=>c.feature==='lip').length>=10);
 assert.equal(data.cubes.filter(c=>c.region==='shoulder').length,0,'No shoulder shell may remain');
 const neck=data.cubes.filter(c=>c.position[1]<.70);
 assert.ok(neck.length>50);
 assert.ok(neck.every(c=>Math.abs(c.position[0])<=.50&&c.position[1]>=.15),'Only the short neck may remain below the head');
 assert.ok(neck.some(c=>Math.abs(c.position[0])>=.44),'Neck must have a stronger lateral silhouette');
 const bottom=side=>Math.min(...neck.filter(c=>c.position[0]*side>.25).map(c=>c.position[1]));
 assert.ok(Math.abs(bottom(1)-bottom(-1))>=.08,'Neck termination must be oblique');
 const edge=data.cubes.filter(c=>c.region==='neck-edge');
 assert.ok(edge.length>10&&edge.length<200);
 assert.ok(edge.every(c=>c.position[1]<.65),'Sparse cubes must stay at the neck cut');
 for(const cube of data.cubes){
  if(cube.region==='neck-edge')assert.ok(cube.motion>0&&cube.motion<=.005);
  else assert.equal(cube.motion,undefined,'The sealed head and neck must remain rigid');
 }
 const model=makeVoxelPortrait(data);
 let pupilInstances=0,movingInstances=0;
 for(const band of model.children){
  const pupil=band.geometry.attributes.instancePupil,motion=band.geometry.attributes.instanceMotion;
  assert.equal(pupil.count,band.count);assert.equal(motion.count,band.count);
  pupilInstances+=[...pupil.array].filter(v=>v===1).length;
  for(let i=0;i<motion.count;i++)if(motion.getX(i)>0)movingInstances++;
  band.geometry.dispose();
 }
 assert.equal(pupilInstances,2);assert.equal(movingInstances,edge.length);
 model.children[0].material.dispose();
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
