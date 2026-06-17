import { expect, test } from "@playwright/test";

test("owner can sign in and see the live orders panel", async ({ page }) => {
  await page.goto("/panel/login");

  await page.locator('input[type="email"]').fill("owner@testkafe.local");
  await page.locator('input[type="password"]').fill("Test12345!");
  await page.getByRole("button", { name: "Giriş yap" }).click();

  await expect(page).toHaveURL(/\/panel$/);
  await expect(
    page.getByRole("heading", { name: "Canlı Siparişler" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bekliyor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Onaylandı" })).toBeVisible();
});
