import * as THREE from "three";
import head from "./head-data.json" with { type: "json" };

export const SLICE_COUNT = head.slices;
export const CONTOUR_FLOATS =
  (head.slices * head.rows + 1) * (head.segments + 1) * head.stride;

export function makeSlices(contours, texture) {
  if (contours.length !== CONTOUR_FLOATS || !contours.every(Number.isFinite)) {
    throw new Error("Invalid portrait contour asset");
  }
  const group = new THREE.Group();
  const gaze = { value: new THREE.Vector2() };
  group.userData.gaze = gaze;
  const steel = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    metalness: 0.4,
    roughness: 0.56,
    envMapIntensity: 0.45,
  });
  // The exact source photograph supplies identity. Only local iris UVs move.
  steel.onBeforeCompile = (shader) => {
    shader.uniforms.portraitGaze = gaze;
    shader.fragmentShader =
      "uniform vec2 portraitGaze;\n" + shader.fragmentShader;
    const eyes = head.eyes
      .map(
        (eye, i) => `
      vec2 d${i} = vMapUv - vec2(${eye.center.join(",")});
      d${i} = mat2(${Math.cos(head.eyeAngle)}, ${-Math.sin(head.eyeAngle)}, ${Math.sin(head.eyeAngle)}, ${Math.cos(head.eyeAngle)}) * d${i};
      float mask${i} = 1.0 - smoothstep(.4,1.0,length(d${i}/vec2(${eye.radius.join(",")})));
    `,
      )
      .join("\n");
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      eyes +
        THREE.ShaderChunk.map_fragment
          .replace(
            "texture2D( map, vMapUv )",
            "texture2D( map, vMapUv - portraitGaze * max(mask0,mask1) )",
          )
          .replace(
            "diffuseColor *= sampledDiffuseColor;",
            "float grey = dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722)); diffuseColor *= vec4(vec3(grey),sampledDiffuseColor.a);",
          ),
    );
  };
  const metal = new THREE.MeshStandardMaterial({
    color: 0x919a9f,
    metalness: 0.78,
    roughness: 0.48,
    envMapIntensity: 0.45,
  });
  const rear = metal;
  const width = head.segments + 1;
  for (let slice = 0; slice < head.slices; slice++) {
    const positions = [],
      normals = [],
      uvs = [],
      indices = [],
      caps = [];
    const offset = slice * head.rows * width * head.stride;
    const top = contours[offset + 1];
    const bottom = contours[offset + head.rows * width * head.stride + 1];
    const center = (top + bottom) / 2;
    const gap = Math.min(0.003, (top - bottom) * 0.05);
    for (let row = 0; row <= head.rows; row++) {
      for (let col = 0; col < width; col++) {
        const k = offset + (row * width + col) * head.stride;
        positions.push(
          contours[k],
          (contours[k + 1] - center) * (1 - gap / (top - bottom)),
          contours[k + 2],
        );
        uvs.push(contours[k + 3], contours[k + 4]);
        // Neighbouring contours keep surface lighting continuous across the cut seams.
        const globalRow = slice * head.rows + row;
        const prev =
          (globalRow * width + ((col + head.segments - 1) % head.segments)) *
          head.stride;
        const next =
          (globalRow * width + ((col + 1) % head.segments)) * head.stride;
        const above = (Math.max(0, globalRow - 1) * width + col) * head.stride;
        const below =
          (Math.min(head.slices * head.rows, globalRow + 1) * width + col) *
          head.stride;
        const tangent = new THREE.Vector3(
          contours[next] - contours[prev],
          0,
          contours[next + 2] - contours[prev + 2],
        );
        const down = new THREE.Vector3(
          contours[below] - contours[above],
          contours[below + 1] - contours[above + 1],
          contours[below + 2] - contours[above + 2],
        );
        normals.push(...tangent.cross(down).normalize().toArray());
      }
    }
    const shell = new THREE.BufferGeometry();
    // Separate front UVs keep the procedural eye slots off the rear of the head.
    for (let half = 0; half < 2; half++) {
      const start = indices.length;
      for (let row = 0; row < head.rows; row++) {
        for (
          let col = (half * head.segments) / 2;
          col < ((half + 1) * head.segments) / 2;
          col++
        ) {
          const a = row * width + col,
            b = a + width;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
      shell.addGroup(start, indices.length - start, half);
    }
    shell.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    shell.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    shell.setIndex(indices);
    shell.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    for (const row of [0, head.rows]) {
      let x = 0,
        z = 0;
      for (let col = 0; col < head.segments; col++) {
        const k = (row * width + col) * 3;
        x += positions[k];
        z += positions[k + 2];
      }
      const middle = [
        x / head.segments,
        positions[row * width * 3 + 1],
        z / head.segments,
      ];
      for (let col = 0; col < head.segments; col++) {
        const a = (row * width + col) * 3,
          b = a + 3;
        const first = positions.slice(a, a + 3),
          next = positions.slice(b, b + 3);
        caps.push(
          ...middle,
          ...(row === 0 ? next : first),
          ...(row === 0 ? first : next),
        );
      }
    }
    const cap = new THREE.BufferGeometry();
    cap.setAttribute("position", new THREE.Float32BufferAttribute(caps, 3));
    cap.computeVertexNormals();
    const layer = new THREE.Group();
    layer.userData.restY = center;
    layer.position.y = center;
    layer.add(new THREE.Mesh(shell, [steel, rear]), new THREE.Mesh(cap, metal));
    group.add(layer);
  }
  return group;
}
