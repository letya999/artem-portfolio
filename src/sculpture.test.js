import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeSlices } from './sculpture.js';
test('portrait becomes 38 separate textured relief layers with metal sides and backs', () => {
  const pixels = new Uint8ClampedArray(256 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 64; x < 192; x++) pixels[(y * 256 + x) * 4 + 3] = 255;
  const texture = new THREE.Texture();
  const sculpture = makeSlices(texture, pixels);
  assert.equal(sculpture.children.length, 38);
  assert.ok(sculpture.children[0].position.y > sculpture.children[37].position.y);
  for (const layer of sculpture.children) {
    assert.equal(layer.children.length, 3);
    const [front, sides, back] = layer.children;
    assert.equal(front.material.map, texture);
    assert.equal(sides.material.metalness, 1);
    assert.equal(back.material.metalness, 1);
    front.geometry.computeBoundingBox();
    assert.ok(front.geometry.boundingBox.max.z > front.geometry.boundingBox.min.z, 'face must have relief depth');
    assert.ok(front.geometry.boundingBox.max.x < .9, 'silhouette determines width');
    assert.ok(front.geometry.attributes.uv.count > 0);
    for (const mesh of layer.children) assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  }
});
