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
