import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {useI18n} from './i18n.jsx';
export default function ScanPreview(){
 const host=useRef(null);const {t}=useI18n();const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let renderer,geometry,material,disposed=false;
  const abort=new AbortController(),element=host.current;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));element.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.01,50);camera.position.set(0,.05,2.6);
  scene.add(new THREE.HemisphereLight(0xffffff,0x424d42,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-2,3,4);scene.add(light);
  const render=()=>{if(!disposed)renderer.render(scene,camera);};
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableZoom=false;controls.enablePan=false;controls.addEventListener('change',render);
  const resize=new ResizeObserver(()=>{renderer.setSize(element.clientWidth,element.clientHeight);camera.aspect=element.clientWidth/element.clientHeight;camera.updateProjectionMatrix();render();});resize.observe(element);
  fetch('./story/scan.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('scan');return r.json();}).then(data=>{
   if(disposed)return;geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.vertices,3));geometry.setIndex(data.indices);geometry.computeVertexNormals();geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new THREE.Vector3());geometry.center();geometry.scale(1.4/size.y,1.4/size.y,1.4/size.y);
   material=new THREE.MeshStandardMaterial({color:0xaeb8b3,metalness:.35,roughness:.43,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.rotation.y=-.25;scene.add(mesh);render();
  }).catch(e=>{if(e.name!=='AbortError')setFailed(true);});
  return()=>{disposed=true;abort.abort();resize.disconnect();controls.dispose();geometry?.dispose();material?.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <><div className="scan-preview" ref={host} role="img" aria-label={t('Интерактивный скан лица')}/><p className="scan-hint">{t(failed?'Не удалось загрузить 3D. Скриншоты скана доступны выше.':'Потяните модель, чтобы повернуть скан.')}</p></>;
}
