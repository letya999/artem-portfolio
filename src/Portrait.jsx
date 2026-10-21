import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeVoxelPortrait } from "./voxel.js";
import { layerPose, cursorTarget, stepSpring } from "./motion.js";
export default function Portrait() {
  const ref = useRef(null),
    control = useRef({ paused: false, spread: false, replay: 0 });
  const [paused, setPaused] = useState(false),
    [spread, setSpread] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const host = ref.current,
      scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
    camera.position.set(0, 0.1, 6.15);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .88;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color().setScalar(.19);
    const panelGeometry = new THREE.PlaneGeometry(1, 1);
    const panels = [
      {position: [-3, 2, 4], size: [3, 5], intensity: 5},
      {position: [4, 1, 2], size: [3, 4], intensity: 2.5},
      {position: [0, 5, 0], size: [4, 3], intensity: 3},
      {position: [-2, 0, -4], size: [2, 4], intensity: 2},
      {position: [0, -1, 5], size: [5, 3], intensity: .9},
    ];
    for (const p of panels) {
      const material = new THREE.MeshBasicMaterial({color: new THREE.Color().setScalar(p.intensity), side: THREE.DoubleSide});
      const panel = new THREE.Mesh(panelGeometry, material);
      panel.position.set(...p.position);
      panel.scale.set(...p.size, 1);
      panel.lookAt(0, 0, 0);
      studio.add(panel);
    }
    const env = pmrem.fromScene(studio, .012);
    scene.environment = env.texture;
    scene.environmentIntensity = .85;
    studio.children.forEach(p => p.material.dispose());
    panelGeometry.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x363c44, 0.25));
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(-3, 3, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {left: -3, right: 3, top: 3, bottom: -3, near: .1, far: 15});
    light.shadow.normalBias = .008;
    light.shadow.bias = -.0001;
    scene.add(light);
    const resize = new ResizeObserver(() => {
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.left = (-2 * r.width) / r.height;
      camera.right = (2 * r.width) / r.height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host);
    let sculpture,
      disposed = false,
      time = 0,
      last = performance.now(),
      amount = 0,
      replay = 0,
      visible = true;
    const pointer = { x: 0, y: 0 };
    const yaw = {value: -.60, velocity: 0}, pitch = {value: 0, velocity: 0};
    const assembly = {value: 0, velocity: 0};
    const move = (e) => {
      Object.assign(
        pointer,
        cursorTarget(e.clientX, e.clientY, innerWidth, innerHeight),
      );
    };
    const leave = () => {
      pointer.x = pointer.y = 0;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    const visibleObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibleObserver.observe(host);
    const lost = (e) => {
      e.preventDefault();
      host.classList.remove("loaded");
      setReady(false);
      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const abort = new AbortController();
    fetch("./voxel-portrait.json", { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error("Portrait unavailable"); return r.json(); })
      .then(data => {
        if (disposed) return;
        sculpture = makeVoxelPortrait(data);
        sculpture.scale.setScalar(1.12);
        sculpture.rotation.y = -.60;
        scene.add(sculpture);
        host.classList.add("loaded");
        setReady(true);
      }).catch(() => { /* The original portrait remains visible on load failure. */ });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    renderer.setAnimationLoop((now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!sculpture || !visible || document.hidden) return;
      const c = control.current;
      if (c.replay !== replay) {
        time = 0;
        replay = c.replay;
      }
      if (c.paused) return;
      if (!reduced.matches) time += dt;
      const target = reduced.matches ? 0 : c.spread ? 1 : 0;
      amount = stepSpring(assembly, target, dt, 7);
      sculpture.children.forEach((layer, i) => {
        const p = layerPose(Math.round(i / (sculpture.children.length - 1) * 41), time, amount, reduced.matches);
        layer.position.x = p.x;
        layer.position.z = p.z;
        layer.rotation.y = p.rotation;
        layer.position.y = layer.userData.restY * p.expansion;
      });
      if (reduced.matches) {
        yaw.value = -.60; pitch.value = 0;
        yaw.velocity = pitch.velocity = 0;
        assembly.value = assembly.velocity = 0;
      }
      sculpture.rotation.y = stepSpring(yaw, -.60 + (reduced.matches ? 0 : pointer.x * .26), dt, 9);
      sculpture.rotation.x = stepSpring(pitch, reduced.matches ? 0 : pointer.y * .16, dt, 9);
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      abort.abort();
      host.classList.remove("loaded");
      renderer.setAnimationLoop(null);
      resize.disconnect();
      visibleObserver.disconnect();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const mats = new Set();
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => mats.add(m));
        else if (o.material) mats.add(o.material);
      });
      mats.forEach((m) => m.dispose());
      light.shadow.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="portrait-wrap">
      <div
        ref={ref}
        className="portrait-stage"
        role="img"
        aria-label="Кинетический объёмный портрет Артема"
      >
        <img
          src="./artem-reference.png"
          className="portrait-fallback"
          alt="Артем Летюшев"
        />
      </div>
      <div className="portrait-controls">
        <span>Порядок из сложности</span>
        <div>
          <button
            disabled={!ready}
            aria-pressed={spread}
            onClick={() => {
              control.current.spread = !spread;
              setSpread(!spread);
            }}
          >
            {spread ? "Собрать −" : "Разобрать +"}
          </button>
          <button
            disabled={!ready}
            aria-pressed={paused}
            onClick={() => {
              control.current.paused = !paused;
              setPaused(!paused);
            }}
          >
            {paused ? "Пуск" : "Пауза"}
          </button>
          <button
            disabled={!ready}
            onClick={() => {
              control.current.replay++;
              control.current.paused = false;
              control.current.spread = false;
              setPaused(false);
              setSpread(false);
            }}
          >
            Заново
          </button>
        </div>
      </div>
    </div>
  );
}
