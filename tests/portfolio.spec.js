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
    controls: ["Разобрать +", "Пауза", "Заново"],
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
  await page.route("**/head-contours.bin", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(stage).not.toHaveClass(/loaded/);
  await expect(stage.locator("img")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeDisabled();
});
