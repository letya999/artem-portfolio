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
  const pitch=()=>page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount)?.rotation.x);
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
  const yaw=()=>page.evaluate(()=>window.portraitScenes.flatMap(s=>s.children).find(o=>o.userData.cubeCount).rotation.y);
  const tracking=expect.configure({soft:true,timeout:2000});
  await tracking.poll(async()=>Math.abs(await yaw())).toBeLessThan(.04);
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
  for(const [x,y,axis,limit,direction] of [[10,cy,yaw,-.9,-1],[viewport.width-10,cy,yaw,.60,1],[cx,0,pitch,-.45,-1],[cx,viewport.height-1,pitch,.25,1]]){
    await page.mouse.move(x,y);
    await tracking.poll(async()=>direction*await axis()).toBeGreaterThan(direction*limit);
    await page.waitForTimeout(500);
    await expectInFrame();
  }
  await page.getByRole('button',{name:'Заново',exact:true}).click();
  await page.mouse.move(cx,cy);
  await expectRaised();
});
