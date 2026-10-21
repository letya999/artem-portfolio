import { test } from "node:test";
import assert from "node:assert/strict";
import { layerPose, cursorTarget } from "./motion.js";
import { SLICE_COUNT } from "./sculpture.js";
test("reduced motion keeps all plates assembled even in split mode", () => {
  for (const time of [0, 5, 10, 100])
    for (let i = 0; i < SLICE_COUNT; i++)
      assert.deepEqual(layerPose(i, time, 1, true), {
        x: 0,
        z: 0,
        rotation: 0,
        expansion: 1,
      });
});
test("every plate completes one smooth revolution and returns to the face each cycle", () => {
  for (let i = 0; i < SLICE_COUNT; i++) {
    assert.equal(layerPose(i, 0, 0, false).rotation, 0);
    assert.equal(layerPose(i, 17, 0, false).rotation, Math.PI * 2);
    assert.equal(layerPose(i, 18, 0, false).rotation, 0);
    let previous = 0;
    for (let t = 0; t < 18; t += 0.1) {
      const p = layerPose(i, t, 0, false);
      assert.ok(p.rotation >= previous - 1e-12);
      assert.ok(p.rotation - previous < 0.3, "no angular snapping");
      assert.equal(Math.abs(p.x), 0);
      assert.equal(Math.abs(p.z), 0);
      previous = p.rotation;
    }
  }
  assert.ok(
    Math.abs(
      layerPose(8, 8, 0, false).rotation - layerPose(36, 8, 0, false).rotation,
    ) > 1,
  );
});
test("manual disassembly increases separation without unbounded drift", () => {
  const a = layerPose(8, 5, 1, false),
    b = layerPose(36, 5, 1, false);
  assert.equal(a.expansion, 1.25);
  assert.notEqual(a.rotation, b.rotation);
  assert.ok(a.z > 0.05);
  assert.ok(Math.abs(a.x) <= 0.18);
});
test("gaze maps the entire viewport and clamps out-of-window coordinates", () => {
  assert.deepEqual(cursorTarget(0, 0, 1440, 900), { x: -1, y: -1 });
  assert.deepEqual(cursorTarget(720, 450, 1440, 900), { x: 0, y: 0 });
  assert.deepEqual(cursorTarget(1440, 900, 1440, 900), { x: 1, y: 1 });
  assert.deepEqual(cursorTarget(-20, 1000, 390, 844), { x: -1, y: 1 });
});
