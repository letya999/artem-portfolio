export function layerPose(index, time, spread, reduced) {
  if (reduced) return { x: 0, z: 0, rotation: 0, expansion: 1 };
  const intro = Math.max(0, 1 - time / 3.4) ** 3;
  const t = index / 37;
  const cycle = time % 16;
  const wave = cycle < 6 ? 0 : Math.sin((Math.PI * (cycle - 6)) / 10) ** 2;
  return {
    x: intro * Math.sin(index * 2.4) * 2.7 + spread * Math.sin(t * 7) * 0.45,
    z: intro * Math.cos(index * 1.3) * 2 + spread * Math.cos(t * 5) * 0.4,
    rotation:
      intro * Math.sin(index * 1.9) * 3 +
      Math.sin(time * 0.55 - t * 5) * 0.065 +
      wave * Math.sin(time * 1.4 - t * 7) * 0.9 +
      spread * Math.sin(t * 5 + 0.4) * 1.65,
    expansion: 1 + intro * 1.4 + spread * 0.22,
  };
}
