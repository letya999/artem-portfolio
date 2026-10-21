import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeSlices } from "./sculpture.js";
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
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.12);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x363c44, 0.65));
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(-3, 3, 5);
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
      texture,
      disposed = false,
      time = 0,
      last = performance.now(),
      amount = 0,
      replay = 0,
      visible = true;
    const pointer = { x: 0, y: 0 };
    const gazeTarget = new THREE.Vector2();
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
    Promise.allSettled([
      new THREE.TextureLoader().loadAsync("./artem-reference.png"),
      fetch("./head-contours.bin", { signal: abort.signal }).then((r) => {
        if (!r.ok) throw new Error("Portrait geometry unavailable");
        return r.arrayBuffer();
      }),
    ]).then(([photo, mesh]) => {
      if (photo.status === "fulfilled") texture = photo.value;
      if (
        disposed ||
        photo.status !== "fulfilled" ||
        mesh.status !== "fulfilled"
      ) {
        texture?.dispose();
        return;
      }
      try {
        texture.colorSpace = THREE.SRGBColorSpace;
        sculpture = makeSlices(new Float32Array(mesh.value), texture);
        sculpture.scale.setScalar(0.98);
        scene.add(sculpture);
        host.classList.add("loaded");
        setReady(true);
      } catch {
        texture.dispose();
      }
    });
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
        const p = layerPose(i, time, amount, reduced.matches);
        layer.position.x = p.x;
        layer.position.z = p.z;
        layer.rotation.y = p.rotation;
        layer.position.y = layer.userData.restY * p.expansion;
      });
      sculpture.rotation.y +=
        ((reduced.matches ? 0 : pointer.x * 0.18) - sculpture.rotation.y) *
        (1 - Math.exp(-dt * 5));
      sculpture.rotation.x +=
        ((reduced.matches ? 0 : pointer.y * 0.1) - sculpture.rotation.x) *
        (1 - Math.exp(-dt * 5));
      const gaze = sculpture.userData.gaze.value;
      gaze.lerp(
        gazeTarget.set(
          reduced.matches ? 0 : pointer.x * 0.0035,
          reduced.matches ? 0 : -pointer.y * 0.0015,
        ),
        1 - Math.exp(-dt * 9),
      );
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
