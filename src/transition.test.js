import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {makeVoxelPortrait} from './voxel.js';

test('the neck surface participates in cube waves and every portrait cube can dissolve', () => {
  const model = makeVoxelPortrait(JSON.parse(readFileSync(new URL('../public/voxel-portrait.json', import.meta.url))));
  const neck = model.children.filter(band => band.userData.neckWeight < 1);
  const active = neck.flatMap(band => {
    const a = band.geometry.attributes.instanceWavePosition;
    return Array.from({length: a.count}, (_, i) => a.getW(i));
  });
  const failures = [];
  if (!active.some(value => value === 1)) failures.push('Visible neck cubes must receive the same traveling wave as the skull');
  if (!active.some(value => value === 0)) failures.push('Interior cubes must remain excluded from surface waves');
  const shader = {uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader};
  model.children[0].material.onBeforeCompile(shader);
  if (!model.userData.dissolve || shader.uniforms.portraitDissolve !== model.userData.dissolve || !shader.vertexShader.includes('portraitDissolve')) failures.push('All portrait bands need an actual shared shader dissolution control');
  assert.deepEqual(failures, []);
});
