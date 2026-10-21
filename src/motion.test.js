import { test } from "node:test";
import assert from "node:assert/strict";
import { layerPose } from "./motion.js";
test("reduced motion always displays an assembled static portrait", () => {
  for (const index of [0, 18, 37])
    assert.deepEqual(layerPose(index, 0, 1, true), {
      x: 0,
      z: 0,
      rotation: 0,
      expansion: 1,
    });
});
test("opening fragments travel and settle close to a readable portrait", () => {
  const start = layerPose(9, 0, 0, false);
  const end = layerPose(9, 5, 0, false);
  assert.ok(Math.abs(start.x) > 1, "opening must scatter the layers");
  assert.ok(Math.abs(start.z) > 0.2, "opening needs real depth");
  assert.ok(Math.abs(start.rotation) > 0.3, "layers rotate on assembly");
  assert.ok(start.expansion > 1.5, "layers separate vertically");
  assert.equal(end.x, 0);
  assert.equal(end.expansion, 1);
  assert.ok(
    Math.abs(end.rotation) < 0.08,
    "idle motion must preserve readability",
  );
  assert.notEqual(
    end.rotation,
    0,
    "assembled sculpture remains subtly kinetic",
  );
});
test("disassembly separates and independently rotates settled layers", () => {
  const a = layerPose(4, 5, 1, false),
    b = layerPose(28, 5, 1, false);
  assert.ok(a.expansion > 1);
  assert.ok(Math.abs(a.rotation - b.rotation) > 0.3);
  assert.ok(Math.abs(a.z) > 0.05);
  assert.notEqual(a.x, 0);
});
