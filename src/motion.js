import { SLICE_COUNT } from "./sculpture.js";

export function layerPose(index, time, spread, reduced) {
  if (reduced) return { x: 0, z: 0, rotation: 0, expansion: 1 };
  const t = index / (SLICE_COUNT - 1);
  // Only three neighbouring plates turn occasionally; the face stays readable.
  const cycle = time % 24;
  const start = Math.floor(time / 24) % 2 === 0 ? 5 : 34;
  const selected = index >= start && index < start + 3;
  const progress = Math.max(
    0,
    Math.min(1, (cycle - 9 - (index - start) * 0.3) / 4),
  );
  const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10);
  return {
    x: spread * Math.sin(t * Math.PI * 2) * 0.18,
    z: spread * Math.sin(t * Math.PI) * 0.22,
    rotation:
      (selected ? eased * Math.PI * 2 : 0) +
      spread * Math.sin(t * 8 + time * 0.25) * 1.8,
    expansion: 1 + spread * 0.25,
  };
}

export function cursorTarget(clientX, clientY, width, height, left = 0, top = 0) {
  const distance = Math.max(1, height / 2);
  const x = (clientX - left - width / 2) / distance;
  const y = (clientY - top - height / 2) / distance;
  return {
    x: Math.max(-1.35, Math.min(1.35, Math.atan2(x, 1))),
    y: Math.max(-.60, Math.min(.60, Math.atan2(y, Math.hypot(x, 1)))),
  };
}

// Unit-mass critically damped spring, integrated analytically (stable across frame rates).
export function stepSpring(state, target, dt, frequency = 10) {
  if (![state.value, state.velocity, target, dt, frequency].every(Number.isFinite) || dt < 0 || frequency <= 0) throw new TypeError('Invalid spring state');
  const offset = state.value - target;
  const impulse = state.velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  state.value = target + (offset + impulse * dt) * decay;
  state.velocity = (state.velocity - frequency * impulse * dt) * decay;
  return state.value;
}
