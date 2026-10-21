import { SLICE_COUNT } from "./sculpture.js";

export function layerPose(index, time, spread, reduced) {
  if (reduced) return { x: 0, z: 0, rotation: 0, expansion: 1 };
  const t = index / (SLICE_COUNT - 1);
  // A travelling turn: each plate completes a revolution and locks back into the face.
  const cycle = time % 12;
  const progress = Math.max(0, Math.min(1, (cycle - 2 - t * 3.6) / 4.2));
  const eased =
    progress * progress * progress * (progress * (progress * 6 - 15) + 10);
  return {
    x: spread * Math.sin(t * Math.PI * 2) * 0.18,
    z: spread * Math.sin(t * Math.PI) * 0.22,
    rotation:
      eased * Math.PI * 2 + spread * Math.sin(t * 8 + time * 0.25) * 1.8,
    expansion: 1 + spread * 0.25,
  };
}

export function cursorTarget(clientX, clientY, width, height) {
  return {
    x: Math.max(-1, Math.min(1, (clientX / Math.max(1, width)) * 2 - 1)),
    y: Math.max(-1, Math.min(1, (clientY / Math.max(1, height)) * 2 - 1)),
  };
}
