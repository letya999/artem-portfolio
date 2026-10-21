import { test, expect } from "@playwright/test";
test("visitor explores the kinetic portrait, reads experience and reaches contact", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  expect(
    await page.evaluate(() => ({
      identity:
        document.querySelector("h1")?.textContent.includes("ЛЕТЮШЕВ") ?? false,
      portrait: !!document.querySelector(".portrait-stage canvas"),
      controls: [...document.querySelectorAll("button")].map((b) =>
        b.textContent.trim(),
      ),
      experience: !!document.querySelector("#experience details"),
      contact: !!document.querySelector('a[href="https://t.me/artemletya"]'),
      photo: !!document.querySelector('img[src="./artem-books.jpg"]'),
    })),
  ).toEqual({
    identity: true,
    portrait: true,
    controls: ["Разобрать +", "Обзор 360°", "Пауза", "Заново"],
    experience: true,
    contact: true,
    photo: true,
  });
  await expect(
    page.getByText("Tech / Delivery Project Manager", { exact: true }),
  ).toBeVisible();
  const stage = page.locator(".portrait-stage");
  await expect(stage).toHaveClass(/loaded/);
  await expect(stage.locator("canvas")).toBeVisible();
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  const still = await stage.screenshot();
  await page.waitForTimeout(250);
  expect((await stage.screenshot()).equals(still)).toBe(true);
  await page.getByRole("button", { name: "Пуск", exact: true }).click();
  await page.getByRole("button", { name: /Разобрать/ }).click();
  await expect(page.getByRole("button", { name: /Собрать/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.waitForTimeout(600);
  expect((await stage.screenshot()).equals(still)).toBe(false);
  await page.getByRole("button", { name: "Заново", exact: true }).click();
  await expect(page.getByRole("button", { name: /Разобрать/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("link", { name: "Опыт", exact: true }).click();
  await page.getByText("МТС", { exact: true }).click();
  await expect(page.getByText(/LeSS на SAFe/)).toBeVisible();
  await expect(page.locator('a[href="https://t.me/artemletya"]')).toBeVisible();
  expect(
    (await page.request.get("/Artem-Letyushev-CV.pdf")).headers()[
      "content-type"
    ],
  ).toContain("pdf");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(stage).toHaveClass(/loaded/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("portrait responds to a cursor outside its canvas and preserves the photo on asset failure", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  const stage = page.locator(".portrait-stage");
  await expect(stage).toHaveClass(/loaded/);
  await page.clock.pauseAt(new Date("2026-01-01T00:00:10Z"));
  await page.getByRole("button", { name: "Заново", exact: true }).click();
  // Both positions are over the left text column, outside the portrait canvas.
  await page.mouse.move(20, 140);
  await page.clock.runFor(450);
  const lookingLeft = await stage.screenshot();
  await page.mouse.move(500, 600);
  await page.clock.runFor(450);
  expect((await stage.screenshot()).equals(lookingLeft)).toBe(false);
  await page.route("**/voxel-portrait.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(stage).not.toHaveClass(/loaded/);
  await expect(stage.locator("img")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeDisabled();
});


test("360 overview can be paused and reset", async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await page.getByRole('button',{name:'Обзор 360°',exact:true}).click();
  await expect(page.getByRole('button',{name:'Остановить 360°',exact:true})).toHaveAttribute('aria-pressed','true');
  const canvas=page.locator('.portrait-stage canvas');
  const start=await canvas.screenshot();
  await page.waitForTimeout(650);
  expect((await canvas.screenshot()).equals(start)).toBe(false);
  await page.getByRole('button',{name:'Пауза',exact:true}).click();
  const frozen=await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.getByRole('button',{name:'Заново',exact:true}).click();
  await expect(page.getByRole('button',{name:'Обзор 360°',exact:true})).toHaveAttribute('aria-pressed','false');
});

test('larger portrait keeps its raised rest pose and follows the cursor around its stage',async({page})=>{
  await page.addInitScript(()=>{
    window.portraitScenes=[];
    window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{
      if(event.detail.isScene)window.portraitScenes.push(event.detail);
      if(typeof event.detail.render==='function'){
        const renderer=event.detail,render=renderer.render;
        renderer.render=function(scene,camera){window.portraitCamera=camera;return render.call(this,scene,camera);};
      }
    });
  });
  const pitch=()=>page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount)?.userData.headRotation.x);
  const expectRaised=async()=>{
    await expect.poll(pitch).toBeLessThan(-.06);
    await expect.poll(pitch).toBeGreaterThan(-.14);
  };
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await expectRaised();
  const scale=await page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).scale.x);
  expect.soft(scale).toBeGreaterThanOrEqual(1.38);
  expect.soft(scale).toBeLessThanOrEqual(1.42);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const viewport=page.viewportSize();
  const rect=await page.locator('.portrait-stage').boundingBox();
  const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  await page.mouse.move(cx,cy);
  await expectRaised();
  const yaw=()=>page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).userData.headRotation.y);
  const tracking=expect.configure({soft:true,timeout:2000});
  await tracking.poll(async()=>Math.abs(await yaw())).toBeLessThan(.04);
  for(const [x,y,axis,limit] of [[10,cy,'x',.32],[cx,0,'y',.22]]){
    await page.mouse.move(cx,cy);await page.waitForTimeout(700);
    await page.mouse.move(x,y);await page.waitForTimeout(90);
    const eyes=()=>page.evaluate(axis=>Math.abs(window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).userData.gaze.value[axis]),axis);
    const leading=await eyes();
    expect.soft(leading,`${axis}: Eyes should lead the head within a comfortable ocular angle`).toBeGreaterThan(.08);
    expect.soft(leading,`${axis}: Eye angle must remain bounded`).toBeLessThanOrEqual(limit);
    await page.waitForTimeout(900);
    expect.soft(await eyes(),`${axis}: The eyes should recenter as the head catches up`).toBeLessThan(leading-.02);
  }
  const expectInFrame=async()=>{
    const extents=await page.evaluate(async()=>{
      const {Matrix4,Vector3}=await import('/node_modules/three/build/three.module.js');
      const model=window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount),camera=window.portraitCamera;
      model.updateWorldMatrix(true,true);camera.updateMatrixWorld();
      const matrix=new Matrix4(),p=new Vector3(),min=[Infinity,Infinity],max=[-Infinity,-Infinity];
      for(const band of model.children)for(let i=0;i<band.count;i++){
        band.getMatrixAt(i,matrix);matrix.premultiply(band.matrixWorld);
        for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
          p.set(x,y,z).applyMatrix4(matrix).project(camera);
          min[0]=Math.min(min[0],p.x);min[1]=Math.min(min[1],p.y);
          max[0]=Math.max(max[0],p.x);max[1]=Math.max(max[1],p.y);
        }
      }
      return [...min,...max];
    });
    expect(extents.every(n=>Number.isFinite(n)&&Math.abs(n)<.995),`Projected bounds: ${extents.join(', ')}`).toBe(true);
  };
  for(const [x,y,axis,limit,direction] of [[10,cy,yaw,-.75,-1],[viewport.width-10,cy,yaw,.50,1],[cx,0,pitch,-.35,-1],[cx,viewport.height-1,pitch,.20,1]]){
    await page.mouse.move(x,y);
    await tracking.poll(async()=>direction*await axis()).toBeGreaterThan(direction*limit);
    await page.waitForTimeout(500);
    await expectInFrame();
    const baseTilt=await page.evaluate(()=>{
      const model=window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount);
      model.updateMatrixWorld(true);
      return Math.abs(model.children[0].matrixWorld.elements[6]);
    });
    expect(baseTilt,'The neck base must stay horizontal while the skull tracks the cursor').toBeLessThan(1e-6);
  }
  await page.getByRole('button',{name:'Разобрать +',exact:true}).click();
  const fillVisible=()=>page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).userData.neckFill.visible);
  await expect.poll(fillVisible,{message:'Disassembly must not expose the joint filler'}).toBe(false);
  await page.getByRole('button',{name:'Заново',exact:true}).click();
  await page.mouse.move(cx,cy);
  await expectRaised();
  await expect.poll(fillVisible,{message:'Cubes must fill the neck joint after reassembly'}).toBe(true);
});

test('eyes blink and brows respond locally while pause and reduced motion hold them still',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
    window.portraitScenes=[];
    window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{
      if(event.detail.isScene)window.portraitScenes.push(event.detail);
      if(typeof event.detail.render==='function'){
        const renderer=event.detail,render=renderer.render;
        renderer.render=function(scene,camera){window.portraitRenderer=renderer;window.portraitCamera=camera;return render.call(this,scene,camera);};
      }
    });
  });
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await page.clock.pauseAt(new Date(Date.now()+1000));
  const neutral=await page.locator('.portrait-stage canvas').screenshot();
  await page.evaluate(()=>{
    const scene=window.portraitScenes.find(s=>s.children.some(o=>o.userData.cubeCount));
    scene.children.find(o=>o.userData.cubeCount).userData.expression?.value.set(1,1);
    window.portraitRenderer.render(scene,window.portraitCamera);
  });
  expect((await page.locator('.portrait-stage canvas').screenshot()).equals(neutral),'Blink and brow controls must visibly deform the face').toBe(false);
  await page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).userData.expression.value.set(0,0));
  const expression=()=>page.evaluate(()=>{
    const m=window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount);
    return m.userData.expression?.value.toArray()??[0,0];
  });
  let peak=0,open=false;
  for(let i=0;i<90;i++){
    await page.clock.runFor(100);
    const [blink]=await expression();peak=Math.max(peak,blink);if(blink===0)open=true;
  }
  expect(peak,'The rendered portrait should make a brief blink').toBeGreaterThan(.65);
  expect(open).toBe(true);
  const rect=await page.locator('.portrait-stage').boundingBox(),cx=rect.x+rect.width/2;
  await page.mouse.move(cx,rect.y);await page.clock.runFor(500);
  const up=(await expression())[1];
  await page.mouse.move(cx,rect.y+rect.height);await page.clock.runFor(500);
  expect(up,'Brow response must follow the gaze').toBeGreaterThan((await expression())[1]+.1);
  await page.getByRole('button',{name:'Пауза',exact:true}).click();
  const frozen=await expression();await page.clock.runFor(500);
  expect(await expression()).toEqual(frozen);
  await page.getByRole('button',{name:'Пуск',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(500);
  expect(await expression()).toEqual([0,0]);
  const eyePixels=await page.evaluate(async()=>{
    const {WebGLRenderTarget}=await import('/node_modules/three/build/three.module.js');
    const scene=window.portraitScenes.find(s=>s.children.some(o=>o.userData.cubeCount));
    const model=scene.children.find(o=>o.userData.cubeCount),renderer=window.portraitRenderer;
    const target=new WebGLRenderTarget(512,512),previous=renderer.getRenderTarget();
    const a=new Uint8Array(512*512*4),b=new Uint8Array(a.length);
    try{
      renderer.setRenderTarget(target);model.userData.gaze.value.set(0,0);
      renderer.render(scene,window.portraitCamera);renderer.readRenderTargetPixels(target,0,0,512,512,a);
      model.userData.gaze.value.set(.32,.22);
      renderer.render(scene,window.portraitCamera);renderer.readRenderTargetPixels(target,0,0,512,512,b);
      let changed=0;
      for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>20)changed++;
      return changed;
    }finally{model.userData.gaze.value.set(0,0);renderer.setRenderTarget(previous);target.dispose();}
  });
  expect(eyePixels,'Ocular movement must remain visible at a 512px preview size').toBeGreaterThan(50);
  expect(errors).toEqual([]);
});

test('cube ripples travel across the surface, restore the cubes and recur every 3 to 10 seconds',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
    window.portraitScenes=[];window.__THREE_DEVTOOLS__=new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{
      if(event.detail.isScene)window.portraitScenes.push(event.detail);
      if(typeof event.detail.render==='function'){
        const renderer=event.detail,render=renderer.render;
        renderer.render=function(scene,camera){window.portraitRenderer=renderer;window.portraitCamera=camera;return render.call(this,scene,camera);};
      }
    });
  });
  await page.clock.install();await page.goto('/');
  await expect(page.locator('.portrait-stage')).toHaveClass(/loaded/);
  await page.clock.pauseAt(new Date(Date.now()+1000));
  const state=()=>page.evaluate(()=>{
    const wave=window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).userData.cubeWave;
    return wave?{...wave.state,enabled:wave.enabled.value,sources:wave.sources.length}:{next:0,started:-10,source:-1,enabled:0,sources:0};
  });
  const initial=await state();
  expect.soft(initial.next).toBeGreaterThanOrEqual(3);expect.soft(initial.next).toBeLessThanOrEqual(10);
  const pixels=await page.evaluate(async()=>{
    const {WebGLRenderTarget}=await import('/node_modules/three/build/three.module.js');
    const scene=window.portraitScenes.find(s=>s.children.some(o=>o.userData.cubeCount));
    const model=scene.children.find(o=>o.userData.cubeCount),renderer=window.portraitRenderer,wave=model.userData.cubeWave;
    model.userData.expression.value.set(0,0);model.userData.gaze.value.set(0,0);
    if(wave){wave.enabled.value=1;wave.start.value=0;wave.origin.value.set(0,1.8,.65);wave.axis.value.set(.9,.3,.1).normalize();}
    const target=new WebGLRenderTarget(512,512),previous=renderer.getRenderTarget(),frames=[];
    try{
      renderer.setRenderTarget(target);
      for(const time of [0,.9,3]){
        model.userData.motionTime.value=time;renderer.render(scene,window.portraitCamera);
        const pixels=new Uint8Array(512*512*4);renderer.readRenderTargetPixels(target,0,0,512,512,pixels);frames.push(pixels);
      }
      const changes=frame=>{
        let changed=0;for(let i=0;i<frame.length;i+=4)if(Math.abs(frame[i]-frames[0][i])+Math.abs(frame[i+1]-frames[0][i+1])+Math.abs(frame[i+2]-frames[0][i+2])>20)changed++;return changed;
      };
      return {peak:changes(frames[1]),restored:changes(frames[2])};
    }finally{
      renderer.setRenderTarget(previous);target.dispose();
      if(wave){wave.state.started=-10;wave.state.next=3;wave.start.value=-10;wave.enabled.value=0;}
    }
  });
  expect.soft(pixels.peak,'A travelling wave must visibly flip individual cubes').toBeGreaterThan(100);
  expect.soft(pixels.restored,'Cubes must return exactly to their resting geometry').toBe(0);
  const events=[];
  for(let i=0;i<14;i++){
    await page.clock.runFor(1000);const current=await state();
    if(current.started>=0&&events.at(-1)?.started!==current.started)events.push(current);
  }
  expect.soft(events.length,'Waves must recur rather than run once').toBeGreaterThanOrEqual(2);
  for(const event of events){
    expect.soft(event.next-event.started).toBeGreaterThanOrEqual(3);expect.soft(event.next-event.started).toBeLessThanOrEqual(10);
    expect.soft(event.source).toBeGreaterThanOrEqual(0);expect.soft(event.source).toBeLessThan(event.sources);
  }
  await page.getByRole('button',{name:'Пауза',exact:true}).click();
  const frozen=await state();await page.clock.runFor(1000);expect(await state()).toEqual(frozen);
  await page.getByRole('button',{name:'Пуск',exact:true}).click();
  await page.getByRole('button',{name:'Заново',exact:true}).click();await page.clock.runFor(100);
  const reset=await state();
  expect(reset.started,'Reset must cancel the previous ripple').toBeLessThan(0);
  expect(reset.next).toBeGreaterThanOrEqual(3);expect(reset.next).toBeLessThanOrEqual(10);
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(100);
  expect((await state()).enabled).toBe(0);
  expect(errors).toEqual([]);
});
