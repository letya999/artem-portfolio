import * as THREE from 'three';
import {conveyorPose} from './conveyor-motion.js';

export function createConveyor(root){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return ()=>{};}
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,300);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
  const studio=new THREE.Scene();studio.background=new THREE.Color(.12,.12,.12);
  const panelGeometry=new THREE.PlaneGeometry(1,1);
  for(const [x,y,z,w,h,intensity] of [[-3,2,4,3,5,5],[4,1,2,3,4,2.5],[0,5,0,4,3,3],[-2,0,-4,2,4,2],[0,1,6,8,4,3]]){
    const panel=new THREE.Mesh(panelGeometry,new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.scale.set(w,h,1);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.012);scene.environment=environment.texture;scene.environmentIntensity=.85;studio.children.forEach(p=>p.material.dispose());panelGeometry.dispose();pmrem.dispose();
  const metal=new THREE.MeshStandardMaterial({color:0xc7cdd3,metalness:1,roughness:.24});
  const dark=new THREE.MeshStandardMaterial({color:0x30373e,metalness:.95,roughness:.3});
  scene.add(new THREE.HemisphereLight(0xffffff,0x363c44,.25));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-3,3,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xd1e2ff,1.5);rim.position.set(5,2,-3);scene.add(rim);
  const geometry=new THREE.BoxGeometry(.9,.9,.9),matrix=new THREE.Matrix4();
  const links=[...root.querySelectorAll('a')],models=[],gears=[],rollers=[],listeners=[];
  let width=20,beltWidth=16,belt,frameMesh,active=-1,time=0,previous=0,frame,visible=false,disposed=false,dirty=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function cubes(points,material,name,scale=1){
    const mesh=new THREE.InstancedMesh(geometry,material,points.length);mesh.name=name;
    points.forEach(([x,y,z],i)=>mesh.setMatrixAt(i,matrix.makeScale(scale,scale,scale).setPosition(x,y,z)));
    scene.add(mesh);return mesh;
  }
  const shell=[];
  for(let x=0;x<9;x++)for(let y=0;y<9;y++)for(let z=0;z<7;z++)if((x===0||x===8||y===0||y===8||z===0||z===6)&&!(y===8&&x>2&&x<6&&z>1&&z<5)&&!(x===8&&y<5&&z>1&&z<5))shell.push([(x-4)*.16,(y-4)*.16,(z-3)*.16]);
  const machine=cubes(shell,dark,'conveyor:machine',.16);
  const feed=cubes(Array.from({length:24},()=>[0,0,0]),metal,'conveyor:feed',.09);
  for(let i=0;i<2;i++){
    const points=[];
    for(let a=0;a<16;a++)for(let z=0;z<10;z++)points.push([Math.cos(a*Math.PI/8)*.23,Math.sin(a*Math.PI/8)*.23,(z-4.5)*.12]);
    rollers.push(cubes(points,metal,`conveyor:roller:${i}`,.085));
  }
  for(let i=0;i<2;i++){
    const points=[];
    for(let x=-8;x<=8;x++)for(let y=-8;y<=8;y++){
      const radius=Math.hypot(x,y),edge=6+(Math.cos(Math.atan2(y,x)*10)>.25?1.6:0);
      if(radius<=edge&&(radius>=3.5||Math.abs(x)<1.3||Math.abs(y)<1.3))for(let z=0;z<2;z++)points.push([x*.075,y*.075,z*.075]);
    }
    const gear=cubes(points,metal,`conveyor:gear:${i}`,.075);gear.scale.setScalar(i? .45:.65);gears.push(gear);
  }
  function resize(){
    const r=root.getBoundingClientRect();if(!r.width||!r.height)return;
    width=Math.max(r.width<700?8:11,r.width/56);renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;
    const distance=width/(2*Math.tan(THREE.MathUtils.degToRad(17.5))*camera.aspect);
    camera.position.set(0,distance*.18,distance);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    beltWidth=width*.8;
    machine.position.set(-beltWidth/2+1.15,.05,0);
    gears[0].position.set(machine.position.x-.23,.28,.6);gears[1].position.set(machine.position.x+.32,-.08,.61);
    if(belt){scene.remove(belt);belt.dispose();}
    if(frameMesh){scene.remove(frameMesh);frameMesh.dispose();}
    const points=[],framePoints=[],columns=Math.floor((beltWidth-1.9)/.17)+1;
    for(let x=0;x<columns;x++)for(let z=0;z<8;z++){
      const px=-beltWidth/2+.95+x*.17;
      points.push([px,-.72,(z-3.5)*.13]);points.push([px,-1.12,(z-3.5)*.13]);
      if(z===0||z===7)framePoints.push([px,-.94,(z-3.5)*.16]);
    }
    belt=cubes(points,metal,'conveyor:belt',.125);frameMesh=cubes(framePoints,dark,'conveyor:frame',.15);
    rollers.forEach((r,i)=>r.position.set((i?1:-1)*(beltWidth/2-.6),-.92,0));dirty=true;
  }
  function logo(svg,name){
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),view=doc.documentElement.getAttribute('viewBox').split(/[ ,]+/).map(Number);
    const mask=document.createElement('canvas');mask.width=192;mask.height=96;const ctx=mask.getContext('2d');
    ctx.fillStyle='#fff';const text=doc.querySelector('text');
    if(text){ctx.font='bold 43px Arial';ctx.textAlign='center';ctx.fillText(text.textContent,96,64,182);}
    else {const scale=84/Math.max(view[2],view[3]);ctx.translate(96-view[2]*scale/2,48-view[3]*scale/2);ctx.scale(scale,scale);ctx.translate(-view[0],-view[1]);doc.querySelectorAll('path').forEach(path=>ctx.fill(new Path2D(path.getAttribute('d')),path.getAttribute('fill-rule')||'nonzero'));}
    const pixels=ctx.getImageData(0,0,192,96).data,points=[];
    for(let y=0;y<96;y+=2)for(let x=0;x<192;x+=2)if(pixels[(y*192+x)*4+3]>128)for(let z=0;z<4;z++)points.push([(x-96)*.019,(48-y)*.019,(z-1.5)*.038]);
    if(!points.length)throw new Error('Empty brand mark');
    const model=cubes(points,metal,`conveyor:logo:${name}`,.038);model.rotation.set(.04,-.2,0);model.userData.lift=0;model.computeBoundingBox();return model;
  }
  function draw(now){
    frame=requestAnimationFrame(draw);const dt=Math.min((now-previous)/1000,.05);previous=now;
    if(!visible||document.hidden||models.length!==5)return;
    if(!reduced.matches){time+=dt;dirty=true;}
    if(!dirty)return;
    const start=machine.position.x+.9,end=beltWidth/2-.6,span=end-start,gap=span/6;
    models.forEach((model,i)=>{
      const mobile=root.clientWidth<700;
      const pose=reduced.matches?{x:(i+.5)*gap,y:0,rotation:0}:conveyorPose(time*.85,i,span);
      if(mobile)pose.y*=3;
      const target=active===i&&!reduced.matches?.28:0;model.userData.lift=THREE.MathUtils.damp(model.userData.lift,target,12,dt);
      const scale=mobile?.5:Math.min(.8,(gap-.2)/3.5);
      model.scale.setScalar(scale);model.rotation.z=-pose.rotation;
      model.position.set(start+pose.x,-.42-model.boundingBox.min.y*scale+pose.y+model.userData.lift,.12);model.visible=pose.y>(mobile?-1:-4);
      model.updateMatrixWorld(true);
      const box=model.boundingBox.clone().applyMatrix4(model.matrixWorld),min=new THREE.Vector2(Infinity,Infinity),max=new THREE.Vector2(-Infinity,-Infinity);
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const p=new THREE.Vector3(x,y,z).project(camera),screen=new THREE.Vector2((p.x+1)*root.clientWidth/2,(1-p.y)*root.clientHeight/2);min.min(screen);max.max(screen);
      }
      const el=links[i];el.style.visibility=model.visible?'visible':'hidden';el.style.transform=`translate3d(${min.x}px,${min.y}px,0)`;el.style.width=`${max.x-min.x}px`;el.style.height=`${max.y-min.y}px`;
    });
    gears.forEach((gear,i)=>gear.rotation.z=time*(i?1.3:-.9));
    for(let i=0;i<feed.count;i++){
      const phase=reduced.matches?i/24:(time*.55+i/24)%1;
      matrix.makeRotationZ(phase*4+i).scale(new THREE.Vector3(.09,.09,.09)).setPosition(machine.position.x+Math.sin(i*7)*.18,2.6-phase*phase*2.5,Math.cos(i*3)*.14);feed.setMatrixAt(i,matrix);
    }
    feed.instanceMatrix.needsUpdate=true;feed.frustumCulled=false;
    renderer.render(scene,camera);dirty=false;
  }
  links.forEach((el,i)=>{const enter=()=>{active=i;dirty=true;},leave=()=>{if(active===i)active=-1;dirty=true;};el.addEventListener('pointerenter',enter);el.addEventListener('pointerleave',leave);listeners.push(()=>{el.removeEventListener('pointerenter',enter);el.removeEventListener('pointerleave',leave);});});
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;dirty=true;});observer.observe(root);
  const resizer=new ResizeObserver(resize);resizer.observe(root);
  const mediaChange=()=>{models.forEach(m=>m.userData.lift=0);dirty=true;};reduced.addEventListener('change',mediaChange);
  Promise.all(links.map(async el=>{const response=await fetch(el.querySelector('img').src);if(!response.ok)throw new Error('Brand mark unavailable');return response.text();})).then(svgs=>{
    if(disposed)return;svgs.forEach((svg,i)=>models.push(logo(svg,links[i].getAttribute('aria-label'))));resize();root.classList.add('conveyor-ready');frame=requestAnimationFrame(draw);
  }).catch(()=>{models.forEach(m=>{scene.remove(m);m.dispose();});models.length=0;canvas.hidden=true;});
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();reduced.removeEventListener('change',mediaChange);listeners.forEach(remove=>remove());scene.traverse(m=>{if(m.isInstancedMesh)m.dispose();});geometry.dispose();metal.dispose();dark.dispose();environment.dispose();renderer.dispose();canvas.remove();root.classList.remove('conveyor-ready');};
}
