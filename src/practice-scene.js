import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createHandPose} from './practice-hand.js';
import {pressCycle,tagMotion,PRACTICE_CYCLE_SECONDS} from './practice-cycle.js';
import {createPalmPile,samplePalmParticle} from './practice-material.js';

export function createPracticeScene(root){
  if(!root)return ()=>{};
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return ()=>{};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.className='practice-canvas';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();camera.position.set(0,0,900);camera.lookAt(0,0,0);
  const pmrem=new THREE.PMREMGenerator(renderer),studio=new THREE.Scene();
  studio.background=new THREE.Color().setScalar(.19);
  const panels=[[-3,2,4,3,5,5],[4,1,2,3,4,2.5],[0,5,0,4,3,3],[-2,0,-4,2,4,2],[0,-1,5,5,3,.9]];
  for(const [x,y,z,w,h,power] of panels){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power,power),side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const env=pmrem.fromScene(studio,.012);scene.environment=env.texture;scene.environmentIntensity=.85;
  studio.children.forEach(panel=>{panel.geometry.dispose();panel.material.dispose();});pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x363c44,.25));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-300,300,500);scene.add(key);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-700,right:700,top:600,bottom:-600,near:1,far:1600});key.shadow.normalBias=.1;key.shadow.bias=-.00005;

  const box=new RoundedBoxGeometry(11.3,11.3,11.3,2,1.3),handBox=new RoundedBoxGeometry(1,1,1,2,.08);
  const silver=new THREE.MeshStandardMaterial({color:0xd6d6d6,metalness:1,roughness:.32,envMapIntensity:1.1});
  const handMaterial=new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.32,envMapIntensity:1.1});
  handMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec3 instanceSurfaceNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      float relief=pow(max(0.0,dot(objectNormal,instanceSurfaceNormal)),4.0)*.85;
      objectNormal=normalize(mix(objectNormal,instanceSurfaceNormal,relief));`);
  };
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
  const skinMaterial=new THREE.MeshStandardMaterial({color:0x36383a,metalness:.45,roughness:.5,side:THREE.DoubleSide});
  function hand(role){
    const open=createHandPose(role,0);
    const geometry=handBox.clone();
    geometry.setAttribute('instanceSurfaceNormal',new THREE.InstancedBufferAttribute(new Float32Array(open.tiles.length*3),3));
    const mesh=new THREE.InstancedMesh(geometry,handMaterial,open.tiles.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.name=`practice:hand:${role}`;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
    const skinGeometry=new THREE.BufferGeometry();
    skinGeometry.setAttribute('position',new THREE.BufferAttribute(open.vertices.slice(),3));
    skinGeometry.setIndex(open.indices);skinGeometry.computeVertexNormals();
    const skin=new THREE.Mesh(skinGeometry,skinMaterial);skin.castShadow=true;skin.receiveShadow=true;
    const group=new THREE.Group();group.name=`practice:${role}`;group.add(mesh,skin);scene.add(group);
    let previous=-1;
    group.userData.pose=grip=>{
      if(Math.abs(previous-grip)<.0001)return;previous=grip;
      const pose=createHandPose(role,grip);
      pose.tiles.forEach((tile,i)=>{
        matrix.compose(tile.position,tile.quaternion,tile.scale);mesh.setMatrixAt(i,matrix);
        const normal=tile.normal.clone().applyQuaternion(tile.quaternion.clone().invert());
        geometry.attributes.instanceSurfaceNormal.setXYZ(i,normal.x,normal.y,normal.z);
      });
      mesh.instanceMatrix.needsUpdate=true;geometry.attributes.instanceSurfaceNormal.needsUpdate=true;
      const positions=skinGeometry.attributes.position;positions.array.set(pose.vertices);
      positions.needsUpdate=true;skinGeometry.computeVertexNormals();
    };
    open.tiles.forEach((_,i)=>{const shade=.68+.05*Math.sin(i*12.9898);mesh.setColorAt(i,new THREE.Color().setRGB(shade,shade,shade));});
    group.userData.pose(0);return group;
  }
  const upper=hand('upper'),lower=hand('lower');
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(24,26,28,.24)');gradient.addColorStop(.45,'rgba(24,26,28,.12)');gradient.addColorStop(1,'rgba(24,26,28,0)');
  shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowGeometry=new THREE.PlaneGeometry(240,40);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  const handShadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
  const resultShadowMaterial=shadowMaterial.clone(),resultShadow=new THREE.Mesh(shadowGeometry,resultShadowMaterial);
  scene.add(handShadow,resultShadow);
  const pile=createPalmPile(),step=11.3*pile.pitch/pile.size;
  const points=[];
  for(let x=-1.5;x<=1.5;x++)for(let y=-1.5;y<=1.5;y++)for(let z=-1.5;z<=1.5;z++)points.push(new THREE.Vector3(x*step,y*step,z*step));
  const batchMaterial=silver.clone(),settledMaterial=silver.clone();
  settledMaterial.transparent=true;
  const batch=new THREE.InstancedMesh(box,batchMaterial,points.length),settled=new THREE.InstancedMesh(box,settledMaterial,points.length);
  batch.name='practice:forming-product';settled.name='practice:delivered-product';
  const packedRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.38,.52,.04));
  points.forEach((point,i)=>{matrix.compose(point,rotation.identity(),new THREE.Vector3(1,1,1));settled.setMatrixAt(i,matrix);});
  settled.quaternion.copy(packedRotation);settled.instanceMatrix.needsUpdate=true;
  scene.add(batch,settled);
  const handCount=upper.children[0].count+lower.children[0].count;
  canvas.dataset.handVoxels=String(handCount);canvas.dataset.streamVoxels=String(points.length);canvas.dataset.voxelCount=String(handCount+points.length*2);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const streams=[...root.querySelectorAll('.practice-stream')];
  const tags=streams.map(stream=>[...stream.querySelectorAll('.practice-tag')]);
  root.classList.add('practice-animated');
  let tagOrigins=[],tagSizes=[],tagCycle=-1;
  let frame=0,visible=false,disposed=false,elapsed=0,last=0,dirty=true,width=0,height=0,press,output,lanes;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  const point=(element,stage)=>{const r=element.getBoundingClientRect();return {x:r.left-stage.left+r.width/2-stage.width/2,y:stage.height/2-(r.top-stage.top+r.height/2)};};
  const position=new THREE.Vector3(),sizeVector=new THREE.Vector3();
  const intakePoint=(particle,row,seed,scale)=>{
    const rest=particle.rest.clone().applyMatrix4(lower.matrixWorld);
    if(width<700)return new THREE.Vector3(press.x+(45+(seed%4)*4)*scale,rest.y+(65+(1-row)*7)*scale+13*lower.scale.x,0);
    return rest.add(new THREE.Vector3((-165+row*35+(seed%4)*7)*scale,13*lower.scale.x+(80-row*20+Math.floor(seed/4)*8)*scale,0));
  };
  function draw(){
    if(disposed)return;
    if(dirty){
      const bounds=root.getBoundingClientRect();width=bounds.width;height=bounds.height;renderer.setSize(width,height);
      camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.near=.1;camera.far=2000;camera.updateProjectionMatrix();
      press=point(root.querySelector('[data-press-anchor]'),bounds);output=point(root.querySelector('[data-outcome-anchor]'),bounds);
      lanes=streams.map(el=>point(el,bounds));
      tagOrigins=streams.map(el=>{const r=el.getBoundingClientRect();return {x:r.left-bounds.left-width/2,y:height/2-(r.top-bounds.top),width:r.width};});
      tagSizes=tags.map(group=>group.map(tag=>({width:tag.offsetWidth,height:tag.offsetHeight})));
      if(width<700){press.x-=24;lanes=lanes.map((_,i)=>({x:-width/2+12,y:press.y+(1-i)*44}));}
      dirty=false;
    }
    const state=pressCycle(reduced.matches?26.8:elapsed),{phase,closure,compression,travel}=state;
    const scale=Math.min(1.35,Math.max(.7,width/1250));
    upper.scale.setScalar(scale*1.24);lower.scale.setScalar(scale*1.24);
    upper.userData.pose(closure);lower.userData.pose(closure);
    handShadow.position.set(press.x+10*scale,press.y-210*scale,-150);handShadow.scale.setScalar(scale);
    // The lower palm is the anvil; the upper hand performs the long press stroke.
    upper.position.set(press.x+8*scale,press.y+135*scale,48*scale);
    lower.position.set(press.x+8*scale,press.y-(115-35*closure)*scale,10*scale);
    upper.rotation.set(.66,-.25,-.35+.10*closure);lower.rotation.set(.80,-.18,-.30+.12*closure);
    lower.updateMatrixWorld(true);
    const top=pile.center.clone().add(new THREE.Vector3(0,1.5*pile.pitch+pile.size/2,0)).applyMatrix4(lower.matrixWorld);
    const upperContact=new THREE.Vector3(10,-pile.contactHeight,-7).multiplyScalar(upper.scale.x).applyQuaternion(upper.quaternion);
    upper.position.lerp(top.sub(upperContact),closure);
    const center=pile.center.clone().applyMatrix4(lower.matrixWorld);
    if(!reduced.matches){
      const block=(state.cycle%4)*16;
      if(tagCycle!==state.cycle){
        tags.forEach(group=>group.forEach((tag,index)=>{
          if(index>=block&&index<block+16)tag.dataset.active='';
          else tag.removeAttribute('data-active');
        }));
        tagCycle=state.cycle;
      }
      for(let row=0;row<3;row++)for(let j=0;j<16;j++){
        const particle=pile.particles[j*3+row],tag=tags[row][block+j],origin=tagOrigins[row],size=tagSizes[row][block+j];
        const age=phase*PRACTICE_CYCLE_SECONDS-(particle.arrival-4);
        const target=intakePoint(particle,row,j,scale);
        const from={x:origin.x+size.width/2+8,y:origin.y-12-Math.floor(j/4)*22};
        const motion=tagMotion(age,from,target);
        if(!motion){tag.style.opacity='0';tag.dataset.motion='hidden';continue;}
        tag.style.transform=`translate3d(${motion.x-origin.x-size.width/2}px,${origin.y-motion.y-size.height/2}px,0) scale(${motion.scale})`;
        tag.style.opacity=String(motion.opacity);
        tag.style.setProperty('--morph',String(motion.morph));
        tag.dataset.motion=motion.morph>.9?'cube':'word';
      }
    }
    const destination=new THREE.Vector3(output.x+15*scale,output.y-28*scale,0);
    const batchScale=lower.scale.x*pile.size/11.3;
    const batchOrigin=center.clone().lerp(destination,travel);
    const productRotation=lower.quaternion.clone().slerp(packedRotation,travel)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI*2*travel));
    let accumulated=0;
    for(let i=0;i<points.length;i++){
      const local=samplePalmParticle(pile.particles[i],phase*PRACTICE_CYCLE_SECONDS,compression);
      const particle=pile.particles[i],flight=.8,flightAge=phase*PRACTICE_CYCLE_SECONDS-(particle.arrival-flight);
      if(local)accumulated++;
      if(travel>0){
        position.copy(particle.packed).sub(pile.center).multiplyScalar(lower.scale.x).applyQuaternion(productRotation).add(batchOrigin);
        position.y+=Math.sin(travel*Math.PI)*35*scale;
      }else if(local){
        const support=THREE.MathUtils.lerp(particle.rest.y,particle.packed.y,compression);
        const lift=Math.max(0,local.y-support);
        position.copy(local);position.y-=lift;position.applyMatrix4(lower.matrixWorld);position.y+=lift*lower.scale.x;
      }else if(flightAge>=0){
        const lane=i%3,seed=Math.floor(i/3),from=lanes[lane],progress=ease(flightAge/flight);
        const target=particle.rest.clone().applyMatrix4(lower.matrixWorld);
        target.y+=13*lower.scale.x;
        const start=i<48?intakePoint(particle,lane,seed,scale):
          new THREE.Vector3(from.x-18+(seed%5)*7,from.y+((seed%5)-2)*12,Math.sin(seed*2.2)*20);
        position.copy(start).lerp(target,progress);
        position.y+=Math.sin(Math.PI*progress)*10*scale;
      }
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),particle.yaw*(1-compression)).premultiply(productRotation);
      if(!local&&flightAge>=0)rotation.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(.35,.55,Math.sin(i)*.2)),1-ease(flightAge/flight));
      matrix.compose(position,rotation,sizeVector.setScalar((local||flightAge>=0?batchScale:0)*(1+.13*travel)));batch.setMatrixAt(i,matrix);
    }
    batch.instanceMatrix.needsUpdate=true;batch.visible=travel<1;
    settled.visible=travel===1&&state.exit<1;
    settledMaterial.opacity=1-state.exit;
    settled.position.copy(destination);settled.position.x+=180*scale*state.exit;settled.scale.setScalar(batchScale*1.13);
    resultShadow.position.set(settled.position.x,destination.y-55*scale,-150);resultShadow.scale.set(scale*.65,scale,1);
    resultShadowMaterial.opacity=settled.visible?settledMaterial.opacity:0;
    canvas.dataset.cycleTime=phase.toFixed(3);canvas.dataset.pressPhase=state.stage;canvas.dataset.accumulated=String(accumulated);canvas.dataset.deliveryProgress=travel.toFixed(3);canvas.dataset.productVisible=String(settled.visible);
    renderer.render(scene,camera);
  }
  function tick(now){frame=0;if(!visible||document.hidden||disposed)return;elapsed+=Math.max(0,(now-last)/1000);last=now;draw();if(!reduced.matches)frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=performance.now();if(visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;root.classList.toggle('practice-paused',!visible);resume();});observer.observe(root);
  const resize=new ResizeObserver(()=>{dirty=true;resume();});resize.observe(root);
  reduced.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();reduced.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);[upper,lower].forEach(group=>{group.children[0].geometry.dispose();group.children[0].dispose();group.children[1].geometry.dispose();});skinMaterial.dispose();batch.dispose();settled.dispose();handBox.dispose();handMaterial.dispose();shadowTexture.dispose();shadowGeometry.dispose();shadowMaterial.dispose();resultShadowMaterial.dispose();box.dispose();batchMaterial.dispose();settledMaterial.dispose();silver.dispose();env.dispose();renderer.dispose();canvas.remove();root.classList.remove('practice-paused','practice-animated');};
}
