import * as THREE from 'three';

// Shared beveled cube geometry; each horizontal band rotates as one rigid assembly.
export function makeVoxelPortrait(data) {
  if (!data || data.count !== data.cubes?.length || data.count > 20000 || !Number.isFinite(data.pitch) || !(data.pitch > 0) || !Number.isFinite(data.cubeSize) || !(data.cubeSize > 0)) throw new Error('Invalid voxel portrait');
  const geometry = new THREE.BufferGeometry();
  for (const [key, field] of [['position', 'positions'], ['normal', 'normals']]) {
    const values = data.geometry?.[field]?.flat();
    if (!values?.length || values.length % 3 || !values.every(Number.isFinite)) throw new Error('Invalid cube geometry');
    geometry.setAttribute(key, new THREE.Float32BufferAttribute(values, 3));
  }
  const material = new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 1, roughness: .32, envMapIntensity: 1.1});
  const motionTime={value:0},motionAmount={value:0},gaze={value:new THREE.Vector2()};
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{portraitTime:motionTime,portraitMotion:motionAmount,portraitGaze:gaze});
    shader.vertexShader='attribute vec3 instanceSurfaceNormal; attribute vec2 instanceMotion; attribute float instancePupil; uniform float portraitTime; uniform float portraitMotion; uniform vec2 portraitGaze;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float t=portraitTime;
      float phase=instanceMotion.y;
      float drift=instanceMotion.x*portraitMotion;
      transformed+=vec3(sin(t*.65+phase),cos(t*.52+phase)*.6,sin(t*.41+phase*.7)) * drift;
      transformed*=1.0-min(1.0,instanceMotion.x*100.0)*portraitMotion*.10*(.5+.5*sin(t*.6+phase));
      transformed.xy+=instancePupil*portraitGaze*vec2(.010,-.006);`);
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      float facing = max(0.0, dot(objectNormal, instanceSurfaceNormal));
      float relief = objectNormal.z > 0.8 && instanceSurfaceNormal.z > 0.1 ? 0.95 : pow(facing, 4.0) * 0.85;
      objectNormal = normalize(mix(objectNormal, instanceSurfaceNormal, relief));`);
  };
  const group = new THREE.Group(), bands = new Map();
  data.cubes.forEach(c => {
    if (!c.position?.every(Number.isFinite) || c.position.length !== 3 || !c.quaternion?.every(Number.isFinite) || c.quaternion.length !== 4) throw new Error('Invalid cube transform');
    if(c.motion!==undefined&&(!Number.isFinite(c.motion)||c.motion<0||c.motion>.05))throw new Error('Invalid cube motion');
    if(c.normal && (c.normal.length!==3 || !c.normal.every(Number.isFinite)))throw new Error('Invalid cube surface normal');
    const row = Math.round(c.position[1] / data.pitch);
    if (!bands.has(row)) bands.set(row, []);
    bands.get(row).push(c);
  });
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3().setScalar(data.cubeSize), color = new THREE.Color();
  const centerY = (data.bounds.min[1] + data.bounds.max[1]) / 2;
  [...bands].sort((a,b) => a[0]-b[0]).forEach(([row, cubes]) => {
    const bandGeometry=geometry.clone();
    bandGeometry.setAttribute('instanceSurfaceNormal',new THREE.InstancedBufferAttribute(new Float32Array(cubes.flatMap(c=>c.normal??[0,0,1])),3));
    bandGeometry.setAttribute('instanceMotion',new THREE.InstancedBufferAttribute(new Float32Array(cubes.flatMap(c=>[c.motion??0,c.id*2.39996323])),2));
    bandGeometry.setAttribute('instancePupil',new THREE.InstancedBufferAttribute(new Float32Array(cubes.map(c=>c.feature==='pupil'?1:0)),1));
    const layer = new THREE.InstancedMesh(bandGeometry, material, cubes.length);
    const y = row * data.pitch;
    layer.castShadow = layer.receiveShadow = true;
    layer.position.y = y - centerY;
    layer.userData.restY = layer.position.y;
    cubes.forEach((c,i) => {
      position.fromArray(c.position); position.y -= y;
      rotation.fromArray(c.quaternion).normalize();
      matrix.compose(position, rotation, scale); layer.setMatrixAt(i,matrix);
      // Small deterministic steel variations and cavity occlusion, never a face texture.
      const shade = (.68 + .05 * Math.sin(c.id * 12.9898)) * (c.ao ?? 1);
      layer.setColorAt(i,color.setRGB(shade,shade,shade));
    });
    group.add(layer);
  });
  geometry.dispose();
  group.rotation.order='YXZ';
  group.rotation.x=-.10;
  Object.assign(group.userData,{motionTime,motionAmount,gaze,restPitch:group.rotation.x,width:data.bounds.max[0]-data.bounds.min[0]});
  group.userData.cubeCount = data.count;
  return group;
}
