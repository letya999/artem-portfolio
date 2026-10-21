const surface = [];
for (let row = 0; row < 17; row++) {
  const y = .06 + row * .14;
  const radius = y > 1.5 ? Math.sqrt(Math.max(0, .4 ** 2 - (y - 1.9) ** 2)) : .30 + .29 * Math.sin(Math.PI * (y + .1) / 1.7);
  const cells = Math.max(6, Math.ceil(2 * Math.PI * radius / .14));
  for (let cell = 0; cell < cells; cell++) {
    const angle = cell / cells * Math.PI * 2;
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
    const face = y > 1.6 && z > .1 && Math.abs(x) < .26;
    const apron = y > .25 && y < 1.3 && z > .25 && Math.abs(x) < .32;
    surface.push([x, y, z, face ? .95 : apron ? .78 : .52]);
  }
}
const features = [[-.12, 1.94, .38, .13], [.12, 1.94, .38, .13], [0, 1.77, .38, .3]];
export function layoutMatryoshkas(target, shades, count, rows) {
  for (let i = 0; i < count; i++) {
    const group = Math.min(5, Math.floor(i * 6 / count));
    const start = Math.ceil(group * count / 6), groupCount = Math.ceil((group + 1) * count / 6) - start;
    const local = i - start;
    const point = local < features.length ? features[local] : surface[Math.floor((local - features.length) * surface.length / (groupCount - features.length))];
    const row = rows[group];
    const scale = Math.min(row.width * .70 / 1.2, row.height * .86 / 2.4) * (1 - group * .105);
    target.set([point[0] * scale + row.x, (point[1] - 1.18) * scale + row.y - .075, point[2] * scale, .14 * scale * .98], i * 4);
    shades[i] = point[3];
  }
}
