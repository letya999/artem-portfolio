import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { makeSlices, SLICE_COUNT } from "./sculpture.js";
const bytes = readFileSync(
  new URL("../public/head-contours.bin", import.meta.url),
);
const contours = new Float32Array(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
);
test("baked portrait is made of closed, deep plates rather than rectangular photo strips", () => {
  const sculpture = makeSlices(new THREE.Texture(), contours);
  assert.equal(sculpture.children.length, SLICE_COUNT);
  let triangles = 0;
  for (const layer of sculpture.children) {
    const edges = new Map();
    for (const mesh of layer.children) {
      const p = mesh.geometry.attributes.position;
      assert.ok([...p.array].every(Number.isFinite));
      const index = mesh.geometry.index;
      const count = index ? index.count : p.count;
      const key = (i) =>
        [p.getX(i), p.getY(i), p.getZ(i)].map((v) => v.toFixed(5)).join(",");
      for (let i = 0; i < count; i += 3) {
        const vertices = [0, 1, 2].map((j) =>
          key(index ? index.getX(i + j) : i + j),
        );
        for (let j = 0; j < 3; j++) {
          const edge = [vertices[j], vertices[(j + 1) % 3]].sort().join("|");
          edges.set(edge, (edges.get(edge) || 0) + 1);
        }
        triangles++;
      }
    }
    for (const count of edges.values())
      assert.equal(count, 2, "each plate must be watertight");
  }
  assert.ok(triangles > 100000);
  const cheek = sculpture.children[28].children[0].geometry;
  cheek.computeBoundingBox();
  assert.ok(
    cheek.boundingBox.max.z - cheek.boundingBox.min.z > 1.2,
    "head has full front-to-back volume",
  );
  const nose = sculpture.children[30].children[0].geometry.attributes.position;
  assert.ok(
    [...nose.array].some((z, i) => i % 3 === 2 && z > 0.65),
    "nose protrudes beyond the cheeks",
  );
});
test("invalid geometry is rejected so the photo fallback can remain visible", () => {
  assert.throws(
    () => makeSlices(new THREE.Texture(), new Float32Array(5)),
    /Invalid/,
  );
  const invalid = contours.slice();
  invalid[100] = NaN;
  assert.throws(() => makeSlices(new THREE.Texture(), invalid), /Invalid/);
});
