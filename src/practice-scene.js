import * as THREE from 'three';
export function createPracticeScene(root){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return ()=>{};}
  const canvas=renderer.domElement;canvas.className='practice-canvas';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();camera.position.z=1800;
  scene.add(new THREE.HemisphereLight(0xffffff,0x6a7062,2.5));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-300,600,1000);scene.add(light);
  const geometry=new THREE.BoxGeometry(.87,.87,.87),matrix=new THREE.Matrix4();
  const material=new THREE.MeshStandardMaterial({color:0x354238,metalness:.55,roughness:.36});
  let disposed=false, visible=false, frame=0, phase=0, last=0, lastWidth=0, lastHeight=0;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const words=[];
  function wordMesh(text){
    const mask=document.createElement('canvas');mask.width=420;mask.height=80;
    const ctx=mask.getContext('2d');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 55px "Manrope Variable"';ctx.fillText(text,210,40,400);
    const pixels=ctx.getImageData(0,0,420,80).data,points=[];
    for(let y=0;y<80;y+=4)for(let x=0;x<420;x+=4)if(pixels[(y*420+x)*4+3]>128)points.push([x/4,y/4]);
    const box=new THREE.Box2();points.forEach(([x,y])=>box.expandByPoint(new THREE.Vector2(x,y)));
    const center=box.getCenter(new THREE.Vector2()),size=box.getSize(new THREE.Vector2());
    const mesh=new THREE.InstancedMesh(geometry,material.clone(),points.length*3);mesh.name=`practice:word:${text}`;
    points.forEach(([x,y],i)=>{for(let z=0;z<3;z++)mesh.setMatrixAt(i*3+z,matrix.makeTranslation(x-center.x,center.y-y,z-1));});
    mesh.rotation.set(.16,-.22,-.015);mesh.userData.size=size;scene.add(mesh);return mesh;
  }
  function layout(){
    const rect=root.getBoundingClientRect(),width=rect.width,height=rect.height;
    if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height);lastWidth=width;lastHeight=height;}camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.near=.1;camera.far=3000;camera.updateProjectionMatrix();
    words.forEach(({el,mesh})=>{const parent=el.parentElement,r=parent.getBoundingClientRect(),index=[...parent.children].indexOf(el),angle=index/parent.children.length*Math.PI*2+phase;
      const depth=(Math.cos(angle)+1)/2,s=Math.min((r.width-35)/Math.max(mesh.userData.size.x,1),2.35)*(.55+.45*depth);
      mesh.scale.setScalar(s);mesh.position.set(r.left-rect.left+r.width/2-width/2+Math.sin(angle)*r.width*.12,height/2-(r.top-rect.top+r.height/2)+Math.sin(angle)*r.height*.37,depth*80);
      mesh.rotation.set(.1,-.18+Math.sin(angle)*.12,Math.sin(angle)*.025);mesh.material.transparent=true;mesh.material.opacity=Math.max(0,Math.min(1,(Math.cos(angle)-.15)/.65));mesh.visible=mesh.material.opacity>.01;
    });
    renderer.render(scene,camera);
  }
  function tick(now){frame=0;if(disposed||!visible||document.hidden)return;phase+=Math.min((now-last)||0,40)*.00018;last=now;canvas.dataset.orbitTime=phase.toFixed(4);layout();if(!reduced.matches)frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=performance.now();if(visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});observer.observe(root);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  const resize=new ResizeObserver(layout);resize.observe(root);
  document.fonts.ready.then(()=>{
    if(disposed)return;
    root.querySelectorAll('[data-voxel-word]').forEach(el=>words.push({el,mesh:wordMesh(el.dataset.voxelWord)}));
    canvas.dataset.voxelCount=words.reduce((sum,{mesh})=>sum+mesh.count,0);
    root.classList.add('practice-ready');layout();
  });
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener("visibilitychange",resume);reduced.removeEventListener("change",resume);resize.disconnect();words.forEach(({mesh})=>{mesh.dispose();mesh.material.dispose();});geometry.dispose();material.dispose();renderer.dispose();canvas.remove();root.classList.remove('practice-ready');};
}
