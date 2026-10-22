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
  let disposed=false;
  const words=[];
  function wordMesh(text){
    const mask=document.createElement('canvas');mask.width=420;mask.height=80;
    const ctx=mask.getContext('2d');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 55px "Manrope Variable"';ctx.fillText(text,210,40,400);
    const pixels=ctx.getImageData(0,0,420,80).data,points=[];
    for(let y=0;y<80;y+=4)for(let x=0;x<420;x+=4)if(pixels[(y*420+x)*4+3]>128)points.push([x/4,y/4]);
    const box=new THREE.Box2();points.forEach(([x,y])=>box.expandByPoint(new THREE.Vector2(x,y)));
    const center=box.getCenter(new THREE.Vector2()),size=box.getSize(new THREE.Vector2());
    const mesh=new THREE.InstancedMesh(geometry,material,points.length*3);mesh.name=`practice:word:${text}`;
    points.forEach(([x,y],i)=>{for(let z=0;z<3;z++)mesh.setMatrixAt(i*3+z,matrix.makeTranslation(x-center.x,center.y-y,z-1));});
    mesh.rotation.set(.16,-.22,-.015);mesh.userData.size=size;scene.add(mesh);return mesh;
  }
  function layout(){
    const rect=root.getBoundingClientRect(),width=rect.width,height=rect.height;
    renderer.setSize(width,height);camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.near=.1;camera.far=3000;camera.updateProjectionMatrix();
    words.forEach(({el,mesh})=>{const r=el.getBoundingClientRect(),s=Math.min((r.width-18)/mesh.userData.size.x,2.3);mesh.scale.setScalar(s);mesh.position.set(r.left-rect.left+r.width/2-width/2,height/2-(r.top-rect.top+r.height/2),10);});
    renderer.render(scene,camera);
  }
  const resize=new ResizeObserver(layout);resize.observe(root);
  document.fonts.ready.then(()=>{
    if(disposed)return;
    root.querySelectorAll('[data-voxel-word]').forEach(el=>words.push({el,mesh:wordMesh(el.dataset.voxelWord)}));
    canvas.dataset.voxelCount=words.reduce((sum,{mesh})=>sum+mesh.count,0);
    root.classList.add('practice-ready');layout();
  });
  return ()=>{disposed=true;resize.disconnect();words.forEach(({mesh})=>mesh.dispose());geometry.dispose();material.dispose();renderer.dispose();canvas.remove();root.classList.remove('practice-ready');};
}
