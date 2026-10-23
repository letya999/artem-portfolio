import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createPracticeScene(root){
  if(!root)return ()=>{};
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return ()=>{};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  const canvas=renderer.domElement;
  canvas.className='practice-canvas';
  canvas.setAttribute('aria-hidden','true');
  root.prepend(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera();
  camera.position.set(0,0,900);
  camera.lookAt(0,0,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room);
  scene.environment=env.texture;
  room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x71757a,2.3));
  const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-220,320,500);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,2.2);rim.position.set(260,-180,250);scene.add(rim);
  const box=new THREE.BoxGeometry(7.5,7.5,7.5);
  const silver=new THREE.MeshStandardMaterial({color:0xa9afb4,metalness:.72,roughness:.25});
  const dark=new THREE.MeshStandardMaterial({color:0x686f75,metalness:.8,roughness:.23});
  const matrix=new THREE.Matrix4(),color=new THREE.Color();
  const handVoxels=[];
  const add=(x,y,z)=>handVoxels.push([x,y,z]);
  for(let y=4;y<=50;y+=9)for(let x=-42;x<=42;x+=9)for(const z of [-8,0,8]){
    if(Math.abs(x)>34&&y>38)continue;
    add(x,y,z);
  }
  for(let y=54;y<=147;y+=9)for(let x=-32;x<=32;x+=9)for(const z of [-8,0,8])add(x+(y-54)*.13,y,z);
  for(let f=0;f<4;f++){
    const start=-36+f*22,length=[39,54,59,46][f];
    for(let y=-length;y<=-4;y+=8)for(const z of [-8,0,8])add(start+Math.max(0,-y-25)*.12,y,z);
  }
  for(let n=0;n<8;n++)for(const z of [-8,0,8])add(45+n*5,27-n*8,z);
  function hand(flip){
    const mesh=new THREE.InstancedMesh(box,silver,handVoxels.length);
    handVoxels.forEach(([x,y,z],i)=>{
      matrix.makeTranslation(x,y,z+(i%7===0?2:0));mesh.setMatrixAt(i,matrix);
      mesh.setColorAt(i,color.set(i%13===0?0xffffff:i%9===0?0x7e858a:0xc8cbd0));
    });
    mesh.instanceMatrix.needsUpdate=true;
    const group=new THREE.Group();group.scale.y=flip;group.rotation.x=flip===1?-.28:.28;group.rotation.y=flip===1?-.45:.4;group.rotation.z=flip===1?-.12:.12;
    group.add(mesh);scene.add(group);return group;
  }
  const upper=hand(1),lower=hand(-1);
  const streamCount=135,stream=new THREE.InstancedMesh(box,dark,streamCount);
  const travelCount=42,travel=new THREE.InstancedMesh(box,dark,travelCount);
  const productPoints=[];
  for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++)if(Math.max(Math.abs(x),Math.abs(y),Math.abs(z))===3)productPoints.push([x,y,z]);
  const product=new THREE.InstancedMesh(box,silver,productPoints.length);
  productPoints.forEach(([x,y,z],i)=>{matrix.makeTranslation(x*8,y*8,z*8);product.setMatrixAt(i,matrix);product.setColorAt(i,color.set((x+y+z)%5===0?0xf8f9f7:0xb4b7bb));});
  product.instanceMatrix.needsUpdate=true;
  scene.add(stream,travel,product);product.rotation.set(-.38,.52,.04);
  canvas.dataset.handVoxels=String(handVoxels.length*2);
  canvas.dataset.streamVoxels=String(streamCount);
  canvas.dataset.voxelCount=String(handVoxels.length*2+streamCount+travelCount+productPoints.length);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=false,disposed=false,start=performance.now(),width=0,height=0;
  let press,output,lanes;
  const clamp=(n)=>Math.max(0,Math.min(1,n));
  const smooth=(n)=>{n=clamp(n);return n*n*(3-2*n);};
  const point=(element,stage)=>{const rect=element.getBoundingClientRect();return {x:rect.left-stage.left+rect.width/2-stage.width/2,y:stage.height/2-(rect.top-stage.top+rect.height/2)};};
  function draw(now){
    if(disposed)return;
    if(!press||root.clientWidth!==width||root.clientHeight!==height){
      const bounds=root.getBoundingClientRect();
      width=bounds.width;height=bounds.height;renderer.setSize(width,height);
      camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.near=.1;camera.far=2000;camera.updateProjectionMatrix();
      press=point(root.querySelector('[data-press-anchor]'),bounds);output=point(root.querySelector('[data-outcome-anchor]'),bounds);
      lanes=[...root.querySelectorAll('.practice-stream')].map(el=>{el.style.setProperty('--flow-length',el.clientWidth+'px');return point(el,bounds);});
    }
    const phase=reduced.matches?.48:((now-start)/6200)%1;
    const closing=smooth((phase-.19)/.24)*(1-smooth((phase-.51)/.18));
    const scale=Math.min(1.35,Math.max(.7,width/1250));
    upper.scale.set(scale,scale,scale);lower.scale.set(scale,-scale,scale);
    upper.position.set(press.x,press.y+(95-43*closing)*scale,0);
    lower.position.set(press.x,press.y-(95-43*closing)*scale,0);
    upper.rotation.z=-.12+closing*.055;lower.rotation.z=.12-closing*.055;
    for(let i=0;i<streamCount;i++){
      const lane=i%3,seed=Math.floor(i/3),progress=(phase*1.55+seed/45)%1;
      const from=lanes[lane]||press,jitter=Math.sin(seed*9.17+lane)*16;
      const x=from.x+(press.x-from.x)*progress;
      const y=from.y+(press.y-from.y)*smooth(progress)+jitter*(1-progress);
      const size=(1.4+Math.sin(i*7.31)**2*.6)*(1-progress*.4);
      matrix.makeScale(size,size,size).setPosition(x,y,Math.cos(seed*2.2)*26);
      stream.setMatrixAt(i,matrix);
      if(i%11===0)stream.setColorAt(i,color.set(0xffffff));
    }
    stream.instanceMatrix.needsUpdate=true;
    const emission=smooth((phase-.45)/.17)*(1-smooth((phase-.84)/.14));
    for(let i=0;i<travelCount;i++){
      const delay=i/travelCount*.28,progress=clamp((phase-.48-delay)/.35);
      const scatter=Math.sin(i*4.61)*23*(1-progress);
      const x=press.x+(output.x-press.x)*smooth(progress),y=press.y+(output.y-press.y)*smooth(progress)+scatter;
      const size=emission*(.55+Math.sin(i*3.7)**2*.7);
      matrix.makeScale(size,size,size).setPosition(x,y,Math.cos(i*1.9)*20);
      travel.setMatrixAt(i,matrix);
    }
    travel.instanceMatrix.needsUpdate=true;
    product.position.set(output.x-38*scale,output.y-78*scale,0);
    product.scale.setScalar(scale*(2.15+.12*emission));
    canvas.dataset.cycleTime=phase.toFixed(3);
    renderer.render(scene,camera);
  }
  function tick(now){frame=0;if(!visible||document.hidden||disposed)return;draw(now);if(!reduced.matches)frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);if(visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});observer.observe(root);
  const resize=new ResizeObserver(()=>{width=0;resume();});resize.observe(root);
  reduced.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();reduced.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);[upper,lower].forEach(group=>{group.children[0].dispose();scene.remove(group);});stream.dispose();travel.dispose();product.dispose();box.dispose();silver.dispose();dark.dispose();env.dispose();renderer.dispose();canvas.remove();};
}
