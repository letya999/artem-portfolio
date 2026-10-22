import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('the equation contracts all letter blocks into one absorption point instead of distributing them into six dolls', async () => {
  const imported = await import('./equation.js');
  const pixels = new Uint8ClampedArray(900*400*4); pixels[(4*900+4)*4+3]=255;
  globalThis.document = {createElement: () => ({getContext: () => ({fillText(){},fillRect(){},getImageData:()=>({data:pixels})})})};
  const geometry=new THREE.BoxGeometry(1,1,1);
  geometry.setAttribute('instanceWavePosition',new THREE.InstancedBufferAttribute(new Float32Array(40).fill(1),4));
  const model=new THREE.Group(); model.add(new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial(),10));
  try {
    const equation=imported.makeEquation?.(model);
    const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
    equation?.material.onBeforeCompile(shader);
    assert.ok(equation?.userData.absorption?.value.isVector3 && shader.uniforms.absorption === equation.userData.absorption, 'The equation needs a single shared absorption point at the first doll');
    assert.match(shader.vertexShader,/mix\(destination, absorption, flow\)/, 'At full flow every block must converge inside the bowl');
    assert.equal(equation.geometry.attributes.experienceTarget,undefined, 'Letter blocks must no longer spread into six separate doll silhouettes');
  } finally {delete globalThis.document;}
});
