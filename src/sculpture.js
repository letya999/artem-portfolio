import * as THREE from "three";
export function makeSlices(texture, pixels) {
  const group = new THREE.Group();
  const photo = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.72,
    metalness: 0.05,
    envMapIntensity: 0.3,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xbfc3c1,
    metalness: 1,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 38; i++) {
    const v = 0.065 + ((i + 0.5) * 0.57) / 38,
      row = Math.round(v * 255);
    let left = 0,
      right = 255;
    while (left < 255 && pixels[(row * 256 + left) * 4 + 3] < 100) left++;
    while (right > left && pixels[(row * 256 + right) * 4 + 3] < 100) right--;
    const l = left / 255,
      r = right / 255,
      h = ((3.45 * 0.57) / 38) * 0.93;
    const p = [],
      uv = [],
      ids = [],
      walls = [];
    for (let y = 0; y < 2; y++)
      for (let x = 0; x <= 36; x++) {
        const u = l + ((r - l) * x) / 36;
        const z =
          0.14 + 0.34 * Math.sqrt(Math.max(0, 1 - ((u - 0.49) / 0.5) ** 2));
        p.push((u - 0.5) * 3.45, (0.5 - y) * h, z);
        uv.push(u, 1 - v + ((0.5 - y) * h) / 3.45);
        if (y === 0 && x < 36)
          ids.push(x, x + 37, x + 1, x + 1, x + 37, x + 38);
      }
    const outline = [
      ...Array.from({ length: 37 }, (_, x) => x),
      ...Array.from({ length: 37 }, (_, x) => 73 - x),
    ];
    for (let j = 0; j < outline.length; j++) {
      const a = p.slice(outline[j] * 3, outline[j] * 3 + 3),
        b = p.slice(
          outline[(j + 1) % outline.length] * 3,
          outline[(j + 1) % outline.length] * 3 + 3,
        );
      const c = [a[0], a[1], -0.22],
        d = [b[0], b[1], -0.22];
      walls.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    const front = new THREE.BufferGeometry();
    front.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    front.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    front.setIndex(ids);
    front.computeVertexNormals();
    const side = new THREE.BufferGeometry();
    side.setAttribute("position", new THREE.Float32BufferAttribute(walls, 3));
    side.computeVertexNormals();
    const back = front.clone();
    for (let j = 0; j < back.attributes.position.count; j++)
      back.attributes.position.setZ(j, -0.22);
    back.computeVertexNormals();
    const layer = new THREE.Group();
    layer.add(
      new THREE.Mesh(front, photo),
      new THREE.Mesh(side, metal),
      new THREE.Mesh(back, metal),
    );
    layer.position.y = (0.35 - v) * 3.45;
    group.add(layer);
  }
  return group;
}
