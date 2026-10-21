import { test } from "node:test";
import assert from "node:assert/strict";
import { layerPose, cursorTarget, stepSpring } from "./motion.js";
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
test("only three plates turn occasionally and all return to alignment", () => {
  for (let cycle = 0; cycle < 2; cycle++) {
    const offset = cycle * 24;
    for (let i = 0; i < SLICE_COUNT; i++) {
      assert.equal(layerPose(i, offset + 5, 0, false).rotation, 0);
      assert.ok(
        Math.abs(Math.sin(layerPose(i, offset + 18, 0, false).rotation)) <
          1e-12,
      );
    }
    const moving = Array.from(
      { length: SLICE_COUNT },
      (_, i) => layerPose(i, offset + 11, 0, false).rotation,
    ).filter((r) => r > 0 && r < Math.PI * 2);
    assert.equal(moving.length, 3);
  }
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


test("spring preserves inertia and converges identically at 30 and 120 fps", () => {
  const a = {value: 0, velocity: 0}, b = {value: 0, velocity: 0};
  stepSpring(a, 1, 1/30);
  assert.ok(a.value > 0 && a.value < 1);
  assert.ok(a.velocity > 0);
  for(let i=1;i<60;i++) stepSpring(a,1,1/30);
  for(let i=0;i<240;i++) stepSpring(b,1,1/120);
  assert.ok(Math.abs(a.value-b.value)<1e-12);
  assert.ok(Math.abs(a.value-1)<1e-6);
  stepSpring(a,0,10);
  assert.ok(Math.abs(a.value)<1e-6);
  assert.throws(()=>stepSpring(a,0,-1));
});
