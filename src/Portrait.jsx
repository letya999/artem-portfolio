import {useI18n} from './i18n.jsx';
import PortraitStory from './PortraitStory.jsx';
import PortraitLoader from './PortraitLoader.jsx';
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeVoxelPortrait, poseVoxelPortrait, updateCubeWave } from "./voxel.js";
import { layerPose, cursorTarget, stepSpring } from "./motion.js";
import { makeMatryoshkas } from "./matryoshka.js";
export default function Portrait() {
 const {t}=useI18n();
  const ref = useRef(null),
    control = useRef({ paused: false, spread: false, spinning: false, replay: 0 });

  useEffect(() => {
    const host = ref.current,
      scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-2.05, 2.05, 2.05, -2.05, 0.1, 100);
    host.dataset.scene = 'portrait';
    camera.position.set(0, -.075, 6.15);
    const perspective = new THREE.PerspectiveCamera(32, 1, .1, 100);
    perspective.position.set(0, -.075, 4.1 / (2 * Math.tan(16 * Math.PI / 180)));
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      host.classList.add('fallback-visible', 'load-failed');
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .88;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
      scrollDirty = true;
      if (experienceActive) return;
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.left = (-2.05 * r.width) / r.height;
      camera.right = (2.05 * r.width) / r.height;
      camera.updateProjectionMatrix();
      if(sculpture)sculpture.scale.setScalar(Math.min(1.40,(camera.right-camera.left)*.90/sculpture.userData.width));
      renderer.render(scene, camera);
    });
    resize.observe(host);
    let dolls, experienceActive = false, experienceFlow = 0, targetFlow = 0, scrollDirty = true, activeDoll = 0, careerStage = 0, targetStage = 0, selectOnScroll = true, dollExpanded = true;
    let sceneWidth = 0, sceneHeight = 0;
    const experience = document.querySelector('#experience');
    const experienceSlots = [...document.querySelectorAll('.matryoshka-slot')];
    const careerRows = [...document.querySelectorAll('#experience details')];
    const onScroll = () => { scrollDirty = true; selectOnScroll = true; };
    const onToggle = event => {
      const index = careerRows.indexOf(event.target);
      if (index < 0) return;
      targetStage = index; dollExpanded = event.target.open;
      scrollDirty = true; selectOnScroll = false;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    experience?.addEventListener('toggle', onToggle, true);
    const resetScene = () => {
      renderer.domElement.removeAttribute('style');
      const source = host.getBoundingClientRect();
      renderer.setSize(source.width, source.height);
      camera.left = -2.05 * source.width / source.height;
      camera.right = -camera.left;
      camera.updateProjectionMatrix();
      experienceSlots.forEach(slot => slot.classList.remove('sculpture-rendered'));
      if (dolls) dolls.visible = false;
      if (sculpture) { sculpture.visible = true; sculpture.position.set(0, 0, 0); sculpture.scale.setScalar(Math.min(1.40,(camera.right-camera.left)*.90/sculpture.userData.width)); sculpture.userData.dissolve.value = 0; sculpture.userData.neckFill.visible = amount < .01; }
      experienceActive = false;
      host.dataset.scene = 'portrait';
      experienceFlow = targetFlow = 0;
    };
    let sculpture,
      disposed = false,
      time = 0,
      last = performance.now(),
      amount = 0,
      spinAngle = 0,
      replay = 0,
      visible = true;
    const pointer = { x: 0, y: 0, active: false };
    const yaw = {value: -.60, velocity: 0}, pitch = {value: 0, velocity: 0};
    const assembly = {value: 0, velocity: 0};
    const overview = {value: 0, velocity: 0};
    const brow = {value: 0, velocity: 0};
    const eyeYaw = {value: -.60, velocity: 0}, eyePitch = {value: 0, velocity: 0};
    const move = (e) => {
      const rect = (experienceActive ? experience : host).getBoundingClientRect();
      Object.assign(
        pointer,
        cursorTarget(e.clientX, e.clientY, rect.width, rect.height, rect.left, rect.top),
        {active: true},
      );
    };
    const leave = () => {
      pointer.x = pointer.y = 0;
      pointer.active = false;
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
      host.classList.add('fallback-visible', 'load-failed');
      resetScene();

      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const abort = new AbortController();
    fetch("./voxel-portrait.json", { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error("Portrait unavailable"); return r.json(); })
      .then(data => {
        if (disposed) return;
        sculpture = makeVoxelPortrait(data);
        pitch.value = sculpture.userData.restPitch;
        sculpture.scale.setScalar(Math.min(1.40,(camera.right-camera.left)*.90/sculpture.userData.width));
        sculpture.userData.headRotation.y = -.60;
        poseVoxelPortrait(sculpture, sculpture.userData.headRotation);
        scene.add(sculpture);
        try {
          dolls = makeMatryoshkas(sculpture.children[0].geometry);
          scene.add(dolls);
        } catch { /* The career list remains readable without sculptures. */ }
        renderer.render(scene, camera);
        host.classList.add("loaded");
        host.classList.remove('fallback-visible');

      }).catch(() => { host.classList.add('fallback-visible', 'load-failed'); });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let previousReduced = reduced.matches;
    reduced.addEventListener('change', onScroll);
    renderer.setAnimationLoop((now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!sculpture || document.hidden) return;
      if (previousReduced !== reduced.matches) {
        previousReduced = reduced.matches;
        onScroll();
      }
      const c = control.current;
      if (reduced.matches && !scrollDirty) return;
      const layoutDirty = scrollDirty;
      if (dolls && experience && scrollDirty) {
        scrollDirty = false;
        const rect = experience.getBoundingClientRect();
        if (rect.top < innerHeight * .9 && rect.bottom > 0) {
          const entering = !experienceActive;
          experienceActive = true;
          targetFlow = reduced.matches ? 1 : THREE.MathUtils.clamp((innerHeight * .9 - rect.top) / (innerHeight * .35), 0, 1);
          if (entering || sceneWidth !== innerWidth || sceneHeight !== innerHeight) {
            sceneWidth = innerWidth; sceneHeight = innerHeight;
            renderer.setSize(sceneWidth, sceneHeight, false);
            Object.assign(renderer.domElement.style, {position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '3'});
            perspective.aspect = sceneWidth / sceneHeight;
            perspective.updateProjectionMatrix();
          }
          const units = 4.1 / sceneHeight;
          const slots = experienceSlots.map(slot => slot.getBoundingClientRect());
          dolls.userData.layout(slots.map(r => ({x: (r.left + r.width / 2 - sceneWidth / 2) * units, y: (sceneHeight / 2 - r.top - r.height / 2) * units, width: r.width * units, height: r.height * units})));
          if (selectOnScroll) {
            const centers = slots.map(r => r.top + r.height / 2);
            targetStage = 0;
            for (let i = 0; i < centers.length - 1; i++) {
              if (innerHeight * .45 >= centers[i]) targetStage = i + THREE.MathUtils.clamp((innerHeight * .45 - centers[i]) / (centers[i + 1] - centers[i]), 0, 1);
            }
            if (reduced.matches) targetStage = Math.round(targetStage);
            selectOnScroll = false;
          }
          // Enter near the visible job; subsequent scroll and toggle changes ease toward their target.
          if (entering) careerStage = targetStage;
          sculpture.visible = false;
          experienceSlots.forEach(slot => slot.classList.add('sculpture-rendered'));
          host.dataset.scene = 'experience';
        } else if (experienceActive) resetScene();
      }
      if (experienceActive) {
        const oldStage = careerStage, oldFlow = experienceFlow;
        careerStage = reduced.matches ? targetStage : THREE.MathUtils.damp(careerStage, targetStage, 10, dt);
        experienceFlow = reduced.matches ? targetFlow : THREE.MathUtils.damp(experienceFlow, targetFlow, 10, dt);
        if (Math.abs(careerStage - targetStage) < .0001) careerStage = targetStage;
        if (Math.abs(experienceFlow - targetFlow) < .0001) experienceFlow = targetFlow;
        let changed = layoutDirty || oldStage !== careerStage || oldFlow !== experienceFlow;
        const nextActive = Math.min(careerRows.length - 1, Math.floor(careerStage + .0001));
        if (nextActive !== activeDoll) { activeDoll = nextActive; dollExpanded = true; }
        dolls.userData.active = activeDoll;
        dolls.userData.stage.value = careerStage;
        dolls.userData.flow.value = experienceFlow;
        dolls.visible = experienceFlow > 0;
        if (!c.paused) {
          const values = dolls.userData.dollOpen.value;
          for (let i = 0; i < careerRows.length; i++) {
            const target = i === activeDoll && dollExpanded ? 1 : 0;
            const next = reduced.matches ? target : THREE.MathUtils.damp(values[i], target, 6, dt);
            if (Math.abs(values[i] - next) > .00001) changed = true;
            values[i] = Math.abs(next - target) < .001 ? target : next;
          }
        }
        if (changed) renderer.render(scene, perspective);
        return;
      }
      if (!visible) return;
      if (c.replay !== replay) {
        time = 0;
        const wave=sculpture.userData.cubeWave;
        wave.state.started=wave.start.value=-10;
        wave.state.next=3+Math.random()*7;
        spinAngle = 0;
        overview.value = overview.velocity = 0;
        replay = c.replay;
      }
      if (c.paused) return;
      if (!reduced.matches) time += dt;
      const target = reduced.matches ? 0 : c.spread ? 1 : 0;
      amount = stepSpring(assembly, target, dt, 7);
      sculpture.userData.neckFill.visible = amount < .01;
      if (reduced.matches && !c.spinning) {
        yaw.value = -.60; pitch.value = sculpture.userData.restPitch;
        yaw.velocity = pitch.velocity = 0;
        assembly.value = assembly.velocity = 0;
      }
      if(c.spinning) spinAngle += dt * .65;
      else spinAngle = Math.round(overview.value / (Math.PI * 2)) * Math.PI * 2;
      const following = pointer.active && !c.spinning && !reduced.matches;
      const head = sculpture.userData.headRotation;
      head.y = stepSpring(yaw, following ? THREE.MathUtils.clamp(pointer.x * .82, -.95, .95) : -.60, dt, 7);
      head.x = stepSpring(pitch, sculpture.userData.restPitch + (following ? THREE.MathUtils.clamp(pointer.y * .72, -.38, .42) : 0), dt, 9);
      sculpture.rotation.y = stepSpring(overview, spinAngle, dt, 7);
      poseVoxelPortrait(sculpture, head);
      sculpture.children.forEach((layer, i) => {
        const p = layerPose(Math.round(i / (sculpture.children.length - 1) * 41), time, amount, reduced.matches);
        layer.position.x += p.x;
        layer.position.z += p.z;
        layer.rotateY(p.rotation);
        layer.position.y += layer.userData.restY * (p.expansion - 1);
      });
      const cycle=time%13.7,blinkTime=cycle-(cycle<7.9?3.2:8.7);
      const blinkProgress=blinkTime<0||blinkTime>.22?0:blinkTime<.065?blinkTime/.065:1-(blinkTime-.065)/.155;
      const blink=blinkProgress*blinkProgress*(3-2*blinkProgress);
      const browLift=stepSpring(brow,following?-pointer.y*.65:0,dt,8);
      sculpture.userData.expression.value.set(reduced.matches||c.spinning?0:blink,reduced.matches||c.spinning?0:browLift);
      sculpture.userData.motionTime.value=time;
      sculpture.userData.motionAmount.value=reduced.matches?0:1;
      updateCubeWave(sculpture,time,!reduced.matches&&!c.spinning&&amount<.01);
      const eyeX=stepSpring(eyeYaw,following?THREE.MathUtils.clamp(pointer.x,-1.15,1.15):head.y,dt,24);
      const eyeY=stepSpring(eyePitch,following?THREE.MathUtils.clamp(pointer.y,-.52,.52):head.x-sculpture.userData.restPitch,dt,24);
      sculpture.userData.gaze.value.set(
        reduced.matches||c.spinning?0:THREE.MathUtils.clamp(eyeX-head.y,-.32,.32),
        reduced.matches||c.spinning?0:THREE.MathUtils.clamp(eyeY-(head.x-sculpture.userData.restPitch),-.22,.22),
      );
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      abort.abort();
      host.classList.remove("loaded");
      resetScene();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduced.removeEventListener('change', onScroll);
      experience?.removeEventListener('toggle', onToggle, true);
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
        if(o.customDepthMaterial)mats.add(o.customDepthMaterial);
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
        role="group"
        aria-label={t("Кинетический объёмный портрет Артема")}
      >
        <img src="/portrait-poster.webp" fetchPriority="high" className="portrait-fallback" alt={t("Артем Летюшев")} width="663" height="634" />
        <PortraitLoader/>
      </div>
      <PortraitStory/>
    </div>
  );
}
