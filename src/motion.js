export function layerPose(index, time, spread, reduced) {
  if (reduced) return { x: 0, z: 0, rotation: 0, expansion: 1 };
  const intro = Math.max(0, 1 - time / 3.4) ** 3;
  const t = index / 37;
  return {
    x: intro * Math.sin(index * 2.4) * 2.7 + spread * Math.sin(t * 7) * .45,
    z: intro * Math.cos(index * 1.3) * 2 + spread * Math.cos(t * 5) * .4,
    rotation: intro * Math.sin(index * 1.9) * 3 + Math.sin(time * .55 - t * 5) * .065 + spread * Math.sin(t * 5 + .4) * 1.65,
    expansion: 1 + intro * 1.4 + spread * .22,
  };
}
