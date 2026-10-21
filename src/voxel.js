import * as THREE from 'three';

// Shared beveled cube geometry; each horizontal band rotates as one rigid assembly.
export function makeVoxelPortrait(data) {
  if (!data || data.count !== data.cubes?.length || data.count > 20000 || !(data.pitch > 0) || !(data.cubeSize > 0)) throw new Error('Invalid voxel portrait');
  const geometry = new THREE.BufferGeometry();
  for (const [key, field] of [['position', 'positions'], ['normal', 'normals']]) {
    const values = data.geometry?.[field]?.flat();
    if (!values?.length || values.length % 3 || !values.every(Number.isFinite)) throw new Error('Invalid cube geometry');
    geometry.setAttribute(key, new THREE.Float32BufferAttribute(values, 3));
  }
  const material = new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 1, roughness: .32, envMapIntensity: 1.1});
  const group = new THREE.Group(), bands = new Map();
  data.cubes.forEach(c => {
    if (!c.position?.every(Number.isFinite) || c.position.length !== 3 || !c.quaternion?.every(Number.isFinite) || c.quaternion.length !== 4) throw new Error('Invalid cube transform');
    const row = Math.round(c.position[1] / data.pitch);
    if (!bands.has(row)) bands.set(row, []);
    bands.get(row).push(c);
  });
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3().setScalar(data.cubeSize), color = new THREE.Color();
  const centerY = (data.bounds.min[1] + data.bounds.max[1]) / 2;
  [...bands].sort((a,b) => a[0]-b[0]).forEach(([row, cubes]) => {
    const layer = new THREE.InstancedMesh(geometry, material, cubes.length);
    const y = row * data.pitch;
    layer.castShadow = layer.receiveShadow = true;
    layer.position.y = y - centerY;
    layer.userData.restY = layer.position.y;
    cubes.forEach((c,i) => {
      position.fromArray(c.position); position.y -= y;
      rotation.fromArray(c.quaternion).normalize();
      matrix.compose(position, rotation, scale); layer.setMatrixAt(i,matrix);
      // Small deterministic steel variations and cavity occlusion, never a face texture.
      const shade = (.68 + .07 * Math.sin(c.id * 12.9898)) * (c.ao ?? 1);
      layer.setColorAt(i,color.setRGB(shade,shade,shade));
    });
    group.add(layer);
  });
  group.userData.cubeCount = data.count;
  return group;
}
