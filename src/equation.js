import * as THREE from 'three';
import { layoutMatryoshkas } from './matryoshka.js';

export function achievementProgress(sectionTop, viewportHeight) {
  return THREE.MathUtils.clamp((viewportHeight * .88 - sectionTop) / (viewportHeight * .65), 0, 1);
}

export function makeEquation(model) {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 400;
  const context = canvas.getContext('2d');
  context.font = '800 76px "Manrope Variable", sans-serif';
  context.fillStyle = '#fff';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText('Lead time', 205, 200);
  context.fillText('=', 432, 200);
  context.fillText('WIP', 682, 118);
  context.fillText('Throughput', 682, 280);
  context.fillRect(482, 196, 400, 8);
  const pixels = context.getImageData(0, 0, 900, 400).data, points = [];
  for (let y = 4; y < 400; y += 9) {
    for (let x = 4; x < 900; x += 9) {
      if (pixels[(y * 900 + x) * 4 + 3] > 128) points.push([x / 900 - .5, .5 - y / 400]);
    }
  }
  if (!points.length) throw new Error('Equation glyphs unavailable');
  const geometry = model.children[0].geometry.clone();
  const count = points.length * 3;
  const target = new Float32Array(count * 4);
  const experienceTarget = new Float32Array(count * 4), experienceShade = new Float32Array(count);
  geometry.setAttribute('experienceTarget', new THREE.InstancedBufferAttribute(experienceTarget, 4));
  geometry.setAttribute('experienceShade', new THREE.InstancedBufferAttribute(experienceShade, 1));
  geometry.setAttribute('equationTarget', new THREE.InstancedBufferAttribute(target, 4));
  geometry.setAttribute('equationRelease', new THREE.InstancedBufferAttribute(Float32Array.from({length: count}, (_, i) => i % 97 / 96 * .22), 1));
  const progress = {value: 0};
  const experienceProgress = {value: 0};
  const material = new THREE.MeshStandardMaterial({color: 0xbcc3ca, metalness: 1, roughness: .28, envMapIntensity: 1.4});
  material.onBeforeCompile = shader => {
    shader.uniforms.equationProgress = progress;
    shader.uniforms.experienceProgress = experienceProgress;
    shader.vertexShader = 'attribute vec4 experienceTarget; attribute float experienceShade; varying float vExperienceShade; uniform float experienceProgress; attribute vec4 equationTarget; attribute float equationRelease; uniform float equationProgress; float equationPhase() { return smoothstep(equationRelease, .78 + equationRelease, equationProgress); }\n' + shader.vertexShader;
    shader.fragmentShader = 'varying float vExperienceShade;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vExperienceShade;');
    shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
      transformedNormal = mix(transformedNormal, normalMatrix * objectNormal, smoothstep(.32, 1.0, equationPhase()));
    `);
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      float p = equationPhase();
      float assemble = smoothstep(.32, 1.0, p);
      float fall = sin(3.14159265359 * p);
      vec4 source = instanceMatrix * vec4(transformed, 1.0);
      vec3 destination = equationTarget.xyz + transformed * equationTarget.w;
      float flow = smoothstep(equationRelease * .25, 1.0, experienceProgress);
      destination = mix(destination, experienceTarget.xyz + transformed * experienceTarget.w, flow);
      vExperienceShade = mix(1.0, experienceShade, flow);
      vec3 displaced = mix(source.xyz, destination, assemble);
      displaced.x += .9 * sin(instanceMatrix[3].x * 23.0 + instanceMatrix[3].y * 17.0 + instanceMatrix[3].z * 31.0) * fall;
      displaced.y -= 2.3 * fall;
      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    `);
  };
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const matrix = new THREE.Matrix4(), pool = [];
  for (const band of model.children) {
    const surface = band.geometry.attributes.instanceWavePosition;
    for (let i = 0; i < band.count; i++) if (surface.getW(i) > 0) pool.push({band, index: i});
  }
  if (pool.length < count) throw new Error('Not enough surface cubes');
  const selected = Array.from({length: count}, (_, i) => {
    const entry = pool[Math.floor(i * pool.length / count)];
    const original = new THREE.Matrix4();
    entry.band.getMatrixAt(entry.index, original);
    return {...entry, original};
  });
  let extracted = false;
  mesh.userData.restore = () => {
    if (!extracted) return;
    for (const {band, index, original} of selected) {
      band.setMatrixAt(index, original);
      band.instanceMatrix.needsUpdate = true;
    }
    extracted = false;
  };
  mesh.userData.capture = () => {
    mesh.userData.restore();
    model.updateMatrixWorld(true);
    for (const [i, {band, index, original}] of selected.entries()) {
      mesh.setMatrixAt(i, matrix.copy(original).premultiply(band.matrixWorld));
      band.setMatrixAt(index, matrix.copy(original).scale(new THREE.Vector3(.001, .001, .001)));
      band.instanceMatrix.needsUpdate = true;
    }
    extracted = true;
    mesh.instanceMatrix.needsUpdate = true;
  };
  let lastWidth;
  mesh.userData.layout = width => {
    if (lastWidth === width) return;
    lastWidth = width;
    const size = width * 9 / 900;
    for (let i = 0; i < mesh.count; i++) {
      const point = points[i % points.length];
      target.set([point[0] * width, point[1] * width * 400 / 900 - .075, (Math.floor(i / points.length) - 1) * size, size * .92], i * 4);
    }
    geometry.attributes.equationTarget.needsUpdate = true;
  };
  mesh.userData.progress = progress;
  mesh.userData.experienceProgress = experienceProgress;
  mesh.userData.layoutExperience = rows => {
    layoutMatryoshkas(experienceTarget, experienceShade, count, rows);
    geometry.attributes.experienceTarget.needsUpdate = true;
    geometry.attributes.experienceShade.needsUpdate = true;
  };
  return mesh;
}
