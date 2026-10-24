import {useI18n} from './i18n.jsx';
import PortraitStory from './PortraitStory.jsx';
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeVoxelPortrait, poseVoxelPortrait, updateCubeWave } from "./voxel.js";
import { layerPose, cursorTarget, stepSpring } from "./motion.js";
import { achievementProgress, makeEquation } from "./equation.js";
import { makeMatryoshkas } from "./matryoshka.js";
export default function Portrait() {
 const {t}=useI18n();
  const ref = useRef(null),
    control = useRef({ paused: false, spread: false, spinning: false, replay: 0 });

  useEffect(() => {
    const host = ref.current,
      scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-2.05, 2.05, 2.05, -2.05, 0.1, 100);
    camera.position.set(0, -.075, 6.15);
    const perspective = new THREE.PerspectiveCamera(32, 1, .1, 100);
    perspective.position.set(0, -.075, 4.1 / (2 * Math.tan(16 * Math.PI / 180)));
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      host.classList.add('fallback-visible');
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
      scrollDirty = true;
      if (scrollProgress > 0) return;
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.left = (-2.05 * r.width) / r.height;
      camera.right = (2.05 * r.width) / r.height;
      camera.updateProjectionMatrix();
      if(sculpture)sculpture.scale.setScalar(Math.min(1.40,(camera.right-camera.left)*.90/sculpture.userData.width));
      renderer.render(scene, camera);
    });
    resize.observe(host);
    let equation, dolls, scrollProgress = 0, experienceFlow = 0, scrollDirty = true, activeDoll = 0, careerStage = 0, selectOnScroll = true, dollExpanded = true;
    const equationSlot = document.querySelector('.equation-slot');
    const results = document.querySelector('#results');
    const experience = document.querySelector('#experience');
    const experienceSlots = [...document.querySelectorAll('.matryoshka-slot')];
    const careerRows = [...document.querySelectorAll('#experience details')];
    const onScroll = () => { scrollDirty = true; selectOnScroll = true; };
    const onToggle = event => {
      const index = careerRows.indexOf(event.target);
      if (index < 0) return;
      activeDoll = careerStage = index; dollExpanded = event.target.open;
      scrollDirty = true; selectOnScroll = false;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    experience?.addEventListener('toggle', onToggle, true);
    const resetEquation = () => {
      renderer.domElement.removeAttribute('style');
      const source = host.getBoundingClientRect();
      renderer.setSize(source.width, source.height);
      camera.left = -2.05 * source.width / source.height;
      camera.right = -camera.left;
      camera.updateProjectionMatrix();
      equationSlot?.classList.remove('equation-rendered');
      experienceSlots.forEach(slot => slot.classList.remove('sculpture-rendered'));
      if (equation) { equation.visible = false; equation.userData.restore(); equation.userData.experienceProgress.value = 0; }
      if (dolls) dolls.visible = false;
      if (sculpture) { sculpture.visible = true; sculpture.position.set(0, 0, 0); sculpture.userData.dissolve.value = 0; }
      scrollProgress = 0;
      experienceFlow = 0;
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
    const equationYaw = {value: -.38, velocity: 0};
    const assembly = {value: 0, velocity: 0};
    const overview = {value: 0, velocity: 0};
    const brow = {value: 0, velocity: 0};
    const eyeYaw = {value: -.60, velocity: 0}, eyePitch = {value: 0, velocity: 0};
    const move = (e) => {
      const rect = (scrollProgress > 0 ? experienceFlow > 0 ? experience : equationSlot : host).getBoundingClientRect();
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
      host.classList.add('fallback-visible');
      resetEquation();

      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const abort = new AbortController();
    fetch("./voxel-portrait.json", { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error("Portrait unavailable"); return r.json(); })
      .then(async data => {
        await document.fonts.load('800 76px "Manrope Variable"');
        if (disposed) return;
        sculpture = makeVoxelPortrait(data);
        pitch.value = sculpture.userData.restPitch;
        sculpture.scale.setScalar(Math.min(1.40,(camera.right-camera.left)*.90/sculpture.userData.width));
        sculpture.userData.headRotation.y = -.60;
        poseVoxelPortrait(sculpture, sculpture.userData.headRotation);
        scene.add(sculpture);
        try {
          equation = makeEquation(sculpture);
          scene.add(equation);
          dolls = makeMatryoshkas(sculpture.children[0].geometry);
          scene.add(dolls);
        } catch { /* The readable HTML equation remains available. */ }
        host.classList.add("loaded");

      }).catch(() => { host.classList.add('fallback-visible'); });
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
      if (equation && equationSlot && results && (scrollDirty || reduced.matches)) {
        scrollDirty = false;
        const previous = scrollProgress;
        experienceFlow = experienceSlots.length && experience ? THREE.MathUtils.clamp((innerHeight * .9 - experience.getBoundingClientRect().top) / (innerHeight * .8), 0, 1) : 0;
        if (reduced.matches && experienceFlow > 0) experienceFlow = 1;
        if (experienceFlow > 0 && selectOnScroll) {
          const centers = experienceSlots.map(slot => {const r = slot.getBoundingClientRect();return r.top + r.height / 2;});
          careerStage = 0;
          for (let i = 0; i < centers.length - 1; i++) {
            if (innerHeight * .45 >= centers[i]) careerStage = i + THREE.MathUtils.clamp((innerHeight * .45 - centers[i]) / (centers[i + 1] - centers[i]), 0, 1);
          }
          if (experienceFlow < 1) careerStage = 0;
          // Native scroll offsets round to CSS pixels at the row boundary.
          if (Math.abs(careerStage - Math.round(careerStage)) < .005) careerStage = Math.round(careerStage);
          if (reduced.matches) careerStage = Math.round(careerStage);
          const next = Math.min(5, Math.floor(careerStage + .0001));
          if (next !== activeDoll) dollExpanded = true;
          activeDoll = next; selectOnScroll = false;
        }
        scrollProgress = c.paused ? 0 : reduced.matches ? experienceFlow > 0 ? 1 : 0 : achievementProgress(results.getBoundingClientRect().top, innerHeight);
        if (scrollProgress > 0) {
          if (previous === 0) equation.userData.capture();
          const source = host.getBoundingClientRect(), law = equationSlot.getBoundingClientRect();
          const viewport = {left: 0, top: 0, width: innerWidth, height: innerHeight};
          const destination = {};
          for (const key of ['left', 'top', 'width', 'height']) destination[key] = THREE.MathUtils.lerp(law[key], viewport[key], experienceFlow);
          destination.bottom = destination.top + destination.height;
          const renderWidth = THREE.MathUtils.lerp(Math.max(source.width, law.width * 1.38), innerWidth, experienceFlow);
          const renderHeight = THREE.MathUtils.lerp(source.height, innerHeight, experienceFlow);
          renderer.setSize(renderWidth, renderHeight, false);
          camera.left = -2.05 * renderWidth / renderHeight;
          camera.right = -camera.left;
          camera.updateProjectionMatrix();
          const blend = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
          perspective.aspect = renderWidth / renderHeight;
          perspective.updateProjectionMatrix();
          const left = source.left + source.width / 2 - renderWidth / 2 + (destination.left + destination.width / 2 - source.left - source.width / 2) * blend;
          const top = source.top + source.height / 2 - renderHeight / 2 + (destination.top + destination.height / 2 - source.top - source.height / 2) * blend;
          Object.assign(renderer.domElement.style, {position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${renderWidth}px`, height: `${renderHeight}px`, pointerEvents: 'none', zIndex: '3'});
          const units = 4.1 / renderHeight;
          equation.userData.layout(law.width * units * 1.10);
          const rows = experienceSlots.map((slot, index) => {
            const r = slot.getBoundingClientRect();
            const extent = Math.min(r.width * .90 / 3.2, r.height * .90 / 2.8) * 1.35;
            const centerY = index === 0 && experienceFlow < 1 ? Math.min(r.top + r.height / 2, Math.min(innerHeight, top + renderHeight) - 24 - extent) : r.top + r.height / 2;
            return {x: (r.left + r.width / 2 - left - renderWidth / 2) * units, y: (top + renderHeight / 2 - centerY) * units, width: r.width * units, height: r.height * units};
          });
          dolls.userData.layout(rows);
          dolls.userData.active = activeDoll;
          dolls.userData.stage.value = careerStage;
          dolls.userData.flow.value = experienceFlow;
          dolls.visible = experienceFlow > 0;
          equation.userData.absorption.value.set(rows[0].x, rows[0].y - .075 - dolls.userData.rows[0].scale * .65, 0);
          equation.userData.experienceProgress.value = experienceFlow;
          equation.userData.progress.value = scrollProgress;
          equation.visible = experienceFlow < 1 && destination.bottom > 0 && destination.top < innerHeight;
          sculpture.userData.dissolve.value = scrollProgress;
          sculpture.visible = source.bottom > 0 && scrollProgress < 1;
          sculpture.position.set((source.left + source.width / 2 - left - renderWidth / 2) * units, (top + renderHeight / 2 - source.top - source.height / 2) * units, 0);
          equationSlot.classList.add('equation-rendered');
          experienceSlots.forEach(slot => slot.classList.toggle('sculpture-rendered', experienceFlow > 0));
          equation.rotation.y = equationYaw.value * scrollProgress * (1 - experienceFlow);
          equation.rotation.x = -.12 * scrollProgress * (1 - experienceFlow);
        } else resetEquation();
        host.dataset.equationProgress = String(scrollProgress);
        renderer.render(scene, scrollProgress > 0 ? perspective : camera);
      }
      if (scrollProgress > 0) {
        let changed = false;
        if (dolls.visible && !c.paused) {
          const values = dolls.userData.dollOpen.value;
          for (let i = 0; i < 6; i++) {
            const target = i === activeDoll && dollExpanded ? 1 : 0;
            const next = reduced.matches ? target : THREE.MathUtils.damp(values[i], target, 9, dt);
            if (Math.abs(values[i] - next) > .00001) changed = true;
            values[i] = Math.abs(next-target)<.001 ? target : next;
          }
        }
        if (equation.visible && !c.paused && !reduced.matches) {
          const previous = equation.rotation.y;
          equation.rotation.y = stepSpring(equationYaw, -.38 + (pointer.active ? pointer.x * .16 : 0), dt, 6) * scrollProgress * (1 - experienceFlow);
          if (Math.abs(previous - equation.rotation.y) > .00001) changed = true;
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
      resetEquation();
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
        role="img"
        aria-label={t("Кинетический объёмный портрет Артема")}
      >
        <picture>
          <source srcSet="./artem-reference.webp" type="image/webp" />
          <img
            src="./artem-reference.png"
            className="portrait-fallback"
            alt={t("Артем Летюшев")}
          />
        </picture>
      </div>
      <PortraitStory/>
    </div>
  );
}
