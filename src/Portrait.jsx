import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeSlices } from "./sculpture.js";
import { layerPose } from "./motion.js";
export default function Portrait() {
  const ref = useRef(null),
    control = useRef({ paused: false, spread: false, replay: 0 });
  const [paused, setPaused] = useState(false),
    [spread, setSpread] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const host = ref.current,
      scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.05, 6.15);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    host.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x888880, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 0.85);
    light.position.set(-3, 4, 5);
    scene.add(light);
    const resize = new ResizeObserver(() => {
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host);
    let sculpture,
      texture,
      disposed = false,
      time = 0,
      last = performance.now(),
      amount = 0,
      replay = 0,
      visible = true;
    const pointer = { x: 0, y: 0 };
    const move = (e) => {
      const r = host.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
    };
    const leave = () => {
      pointer.x = pointer.y = 0;
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
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
    new THREE.TextureLoader().load(
      "./portrait.png",
      (t) => {
        if (disposed) {
          t.dispose();
          return;
        }
        texture = t;
        t.colorSpace = THREE.SRGBColorSpace;
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const ctx = c.getContext("2d");
        ctx.drawImage(t.image, 0, 0, 256, 256);
        sculpture = makeSlices(t, ctx.getImageData(0, 0, 256, 256).data);
        sculpture.scale.setScalar(1.5);
        scene.add(sculpture);
        host.classList.add("loaded");
        setReady(true);
      },
      undefined,
      () => setReady(false),
    );
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
      const scroll = Math.min(1, window.scrollY / (innerHeight * 1.2));
      const target = reduced.matches ? 0 : c.spread ? 1 : scroll * 0.65;
      amount += (target - amount) * (1 - Math.exp(-dt * 5));
      sculpture.children.forEach((layer, i) => {
        const p = layerPose(i, time, amount, reduced.matches);
        layer.position.x = p.x;
        layer.position.z = p.z;
        layer.rotation.y = p.rotation;
        layer.position.y =
          (0.35 - (0.065 + ((i + 0.5) * 0.57) / 38)) * 3.45 * p.expansion;
      });
      sculpture.rotation.y +=
        ((reduced.matches ? 0 : pointer.x * 0.28) - sculpture.rotation.y) *
        0.04;
      sculpture.rotation.x +=
        ((reduced.matches ? 0 : pointer.y * 0.12) - sculpture.rotation.x) *
        0.04;
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      resize.disconnect();
      visibleObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const mats = new Set();
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) mats.add(o.material);
      });
      mats.forEach((m) => m.dispose());
      texture?.dispose();
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
          src="./portrait.png"
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
