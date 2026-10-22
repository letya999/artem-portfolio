import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {makeVoxelPortrait} from './voxel.js';
import {useI18n} from './i18n.jsx';
function archivedCubes(data){
 if(!data?.cubes?.length||data.cubes.length!==data.count||data.count>60000)throw Error('model');
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xb9c0ba,metalness:.7,roughness:.32}),data.count);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3().setScalar(data.cubeSize);
 data.cubes.forEach((cube,index)=>{position.fromArray(cube.position);rotation.fromArray(cube.quaternion).normalize();matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);});
 mesh.instanceMatrix.needsUpdate=true;return mesh;
}
export default function ScanPreview({kind='scan',compact=false}){
 const host=useRef(null),actions=useRef({});const {t}=useI18n();const [status,setStatus]=useState('loading'),[attempt,setAttempt]=useState(0);
 const source=({
  'original-voxel':'./story/models/original-voxel.glb',
  'metal-first':'./story/models/metal-first.json',
  'photo-reconstruction':'./story/models/photo-reconstruction.json',
  'scan-transfer':'./story/models/scan-transfer.json',
  'dense-reconstruction':'./story/models/dense-reconstruction.json',
  'voxel':'./voxel-portrait.json',
 })[kind]??'./story/models/iphone-scan.glb';
 useEffect(()=>{
  let renderer,model,disposed=false;
  const abort=new AbortController(),element=host.current;
  setStatus('loading');
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('error');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));element.append(renderer.domElement);
  const distance=kind==='voxel'?4.5:kind==='dense-reconstruction'?4.8:kind==='original-voxel'?3.3:2.9;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.01,50);camera.position.set(0,kind==='voxel'?0:.05,distance);
  scene.add(new THREE.HemisphereLight(0xffffff,0x424d42,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-2,3,4);scene.add(light);
  const render=()=>{if(!disposed)renderer.render(scene,camera);};
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableZoom=!compact;controls.enablePan=false;controls.addEventListener('change',render);
  const reset=()=>{camera.position.set(0,kind==='voxel'?0:.05,distance);controls.target.set(0,0,0);controls.update();render();};
  actions.current={reset,zoom:factor=>{camera.position.multiplyScalar(factor);controls.update();render();}};
  const resize=new ResizeObserver(()=>{const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render();});resize.observe(element);
  fetch(source,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('model');return source.endsWith('.glb')?r.arrayBuffer():r.json();}).then(async data=>{
   if(disposed)return;
   if(source.endsWith('.glb')){model=(await new GLTFLoader().parseAsync(data,'')).scene;model.traverse(part=>{if(part.isMesh){part.material.side=THREE.DoubleSide;if(kind==='original-voxel'){part.material.metalness=.25;part.material.roughness=.42;}}});const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=1.7/Math.max(size.x,size.y,size.z);model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);model.scale.setScalar(scale);}
   else if(kind==='photo-reconstruction'){if(!Array.isArray(data.positions)||data.positions.length%9)throw Error('model');const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geometry.computeVertexNormals();model=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xb8b6ae,metalness:0,roughness:.86,side:THREE.DoubleSide}));const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=1.7/Math.max(size.x,size.y,size.z);model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);model.scale.setScalar(scale);}
   else if(kind==='voxel'||kind==='dense-reconstruction'){model=makeVoxelPortrait(data);model.children[0].material.metalness=.25;model.children[0].material.roughness=.48;}
   else{model=archivedCubes(data);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=1.7/Math.max(size.x,size.y,size.z);model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);model.scale.setScalar(scale);}
   scene.add(model);reset();setStatus('ready');
  }).catch(e=>{if(!disposed&&e.name!=='AbortError')setStatus('error');});
  return()=>{disposed=true;abort.abort();resize.disconnect();controls.dispose();model?.traverse(object=>{object.geometry?.dispose();object.material?.dispose();object.customDepthMaterial?.dispose();});renderer.dispose();renderer.domElement.remove();};
 },[attempt,kind,compact]);
 return <><div className="scan-preview" ref={host} role="img" aria-label={t(kind==='voxel'||kind==='original-voxel'?'Интерактивная 3D-реконструкция':'Интерактивный скан лица')} data-source={source} data-state={status}/><div className="scan-controls">
 {status==='error'?<button onClick={()=>setAttempt(value=>value+1)}>{t('Повторить загрузку')}</button>:<><button disabled={status!=='ready'} onClick={()=>actions.current.zoom(.8)} aria-label={t('Приблизить')}>+</button><button disabled={status!=='ready'} onClick={()=>actions.current.zoom(1.25)} aria-label={t('Отдалить')}>−</button><button disabled={status!=='ready'} onClick={()=>actions.current.reset()}>{t('Исходный вид')}</button></>}
 </div><p className="scan-hint" role="status">{t(status==='error'?'Не удалось загрузить 3D. Скриншоты скана доступны выше.':'Потяните модель, чтобы повернуть скан.')}</p></>;
}
