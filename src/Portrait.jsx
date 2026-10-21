import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeVoxelPortrait } from "./voxel.js";
import { layerPose, cursorTarget } from "./motion.js";
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
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.035);
    scene.environment = env.texture;
    room.dispose();
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
      amount += (target - amount) * (1 - Math.exp(-dt * 5));
      sculpture.children.forEach((layer, i) => {
        const p = layerPose(Math.round(i / (sculpture.children.length - 1) * 41), time, amount, reduced.matches);
        layer.position.x = p.x;
        layer.position.z = p.z;
        layer.rotation.y = p.rotation;
        layer.position.y = layer.userData.restY * p.expansion;
      });
      sculpture.rotation.y +=
        ((reduced.matches ? 0 : pointer.x * 0.30) - sculpture.rotation.y) *
        (1 - Math.exp(-dt * 5));
      sculpture.rotation.x +=
        ((reduced.matches ? 0 : pointer.y * 0.14) - sculpture.rotation.x) *
        (1 - Math.exp(-dt * 5));
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
