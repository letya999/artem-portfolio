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
  const words=[],galaxies=[],speeds=[.82,1.17,.96,1.31];let hover=null;
  const particleGeometry=new THREE.BoxGeometry(1,1,1),particleMaterial=new THREE.MeshStandardMaterial({color:0x435446,metalness:.3,roughness:.58});
  const particleCount=900;
  function galaxy(el,index){
    const mesh=new THREE.InstancedMesh(particleGeometry,particleMaterial,particleCount);
    mesh.name='practice:galaxy';mesh.userData.spinRate=speeds[index];mesh.userData.radialWobble=.018+index*.004;mesh.frustumCulled=false;scene.add(mesh);galaxies.push({el,mesh,index});
  }
  function wordMesh(text){
    const mask=document.createElement('canvas');mask.width=420;mask.height=80;
    const ctx=mask.getContext('2d');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 55px "Manrope Variable"';ctx.fillText(text,210,40,400);
    const pixels=ctx.getImageData(0,0,420,80).data,points=[];
    for(let y=0;y<80;y+=4)for(let x=0;x<420;x+=4)if(pixels[(y*420+x)*4+3]>128)points.push([x/4,y/4]);
    const box=new THREE.Box2();points.forEach(([x,y])=>box.expandByPoint(new THREE.Vector2(x,y)));
    const center=box.getCenter(new THREE.Vector2()),size=box.getSize(new THREE.Vector2());
    const mesh=new THREE.InstancedMesh(geometry,material.clone(),points.length*4);mesh.name=`practice:word:${text}`;
    points.forEach(([x,y],i)=>{for(let z=0;z<4;z++)mesh.setMatrixAt(i*4+z,matrix.makeTranslation(x-center.x,center.y-y,(z-1.5)*1.15));});
    mesh.rotation.set(.16,-.22,-.015);mesh.userData.size=size;scene.add(mesh);return mesh;
  }
  function layout(){
    const rect=root.getBoundingClientRect(),width=rect.width,height=rect.height;
    if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height);lastWidth=width;lastHeight=height;}camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.near=.1;camera.far=3000;camera.updateProjectionMatrix();
    galaxies.forEach(({el,mesh,index})=>{
      const r=el.getBoundingClientRect(),cx=r.left-rect.left+r.width/2-width/2,cy=height/2-(r.top-rect.top+r.height/2);
      for(let i=0;i<particleCount;i++){
        const arm=i%2,t=(Math.floor(i/2)+.5)/Math.ceil(particleCount/2),seed=Math.sin(i*127.1)*43758.5453,jitter=(seed-Math.floor(seed)-.5)*.22;
        const angle=arm*Math.PI+t*Math.PI*3+phase*speeds[index]+index*.63+jitter,radius=Math.sqrt(t),core=i>particleCount-90;
        const flutter=mesh.userData.radialWobble*Math.sin(phase*(2.2+index*.16)+i*1.37),orbitRadius=Math.max(0,(core?radius*.25:radius)+flutter);
        const x=cx+Math.cos(angle)*r.width*.43*orbitRadius,y=cy+Math.sin(angle)*r.height*.30*orbitRadius;
        const z=Math.sin(angle)*22+(core?4:0),size=core?2.7:1.35+(1-t)*1.25;
        matrix.makeScale(size,size,size).setPosition(x,y,z-18);mesh.setMatrixAt(i,matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;
    });
    words.forEach(({el,mesh,galaxyIndex})=>{const parent=el.parentElement,r=parent.getBoundingClientRect(),index=[...parent.children].indexOf(el),count=parent.children.length;
      const ring=index%3,slot=Math.floor(index/3),slots=Math.ceil((count-ring)/3),angle=slot/slots*Math.PI*2+ring*1.18+phase*speeds[galaxyIndex]+galaxyIndex*.63;
      const radius=[.99,.63,.29][ring],orbitX=Math.cos(angle)*r.width*.45*radius,orbitY=Math.sin(angle)*r.height*.28*radius;
      const depth=(Math.sin(angle)+1)/2,x=r.left-rect.left+r.width/2-width/2+orbitX,y=height/2-(r.top-rect.top+r.height/2)+orbitY;
      const focus=hover?Math.max(0,1-Math.hypot(hover.x-x,hover.y-y)/85):0;
      const s=Math.min(r.width*.3/Math.max(mesh.userData.size.x,1),1.85)*(.88+.12*depth)*(1+focus*.48);
      mesh.scale.setScalar(s);mesh.position.set(r.left-rect.left+r.width/2-width/2+orbitX,height/2-(r.top-rect.top+r.height/2)+orbitY,Math.sin(angle)*22);
      mesh.rotation.set(-.12,Math.sin(angle)*.22,0);mesh.material.transparent=true;mesh.material.opacity=.66+.34*depth;mesh.visible=true;
    });
    for(const galaxy of galaxies){
      const labels=words.filter(word=>word.galaxyIndex===galaxy.index).map(word=>word.mesh);
      for(let pass=0;pass<10;pass++)for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
        const a=labels[i],b=labels[j],dx=Math.abs(a.position.x-b.position.x),dy=Math.abs(a.position.y-b.position.y);
        const xLimit=(a.userData.size.x*a.scale.x+b.userData.size.x*b.scale.x)/2+4;
        const yLimit=(a.userData.size.y*a.scale.y+b.userData.size.y*b.scale.y)/2+4;
        if(dx<xLimit&&dy<yLimit){const shift=(yLimit-dy)/2+.5,direction=a.position.y>=b.position.y?1:-1;a.position.y+=shift*direction;b.position.y-=shift*direction;}
      }
    }
    renderer.render(scene,camera);
  }
  function tick(now){frame=0;if(disposed||!visible||document.hidden)return;phase+=Math.min((now-last)||0,40)*.00018;last=now;canvas.dataset.orbitTime=phase.toFixed(4);layout();if(!reduced.matches)frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=performance.now();if(visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  function pointerMove(event){const r=root.getBoundingClientRect();hover={x:event.clientX-r.left-r.width/2,y:r.height/2-(event.clientY-r.top)};if(reduced.matches)layout();}
  function pointerLeave(){hover=null;if(reduced.matches)layout();}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});observer.observe(root);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  root.addEventListener('pointermove',pointerMove,{passive:true});root.addEventListener('pointerleave',pointerLeave);
  const resize=new ResizeObserver(layout);resize.observe(root);
  document.fonts.ready.then(()=>{
    if(disposed)return;
    const groups=[...root.querySelectorAll('.voxel-tags')];
    root.querySelectorAll('[data-voxel-word]').forEach(el=>words.push({el,mesh:wordMesh(el.dataset.voxelWord),galaxyIndex:groups.indexOf(el.parentElement)}));
    groups.forEach(galaxy);
    canvas.dataset.voxelCount=words.reduce((sum,{mesh})=>sum+mesh.count,0);
    canvas.dataset.galaxyCount=galaxies.length;canvas.dataset.particleCount=galaxies.length*particleCount;
    root.classList.add('practice-ready');layout();
  });
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener("visibilitychange",resume);reduced.removeEventListener("change",resume);root.removeEventListener('pointermove',pointerMove);root.removeEventListener('pointerleave',pointerLeave);resize.disconnect();words.forEach(({mesh})=>{mesh.dispose();mesh.material.dispose();});galaxies.forEach(({mesh})=>mesh.dispose());particleGeometry.dispose();particleMaterial.dispose();geometry.dispose();material.dispose();renderer.dispose();canvas.remove();root.classList.remove('practice-ready');};
}
