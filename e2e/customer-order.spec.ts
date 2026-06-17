import { expect, test } from "@playwright/test";

test("customer can order and pay from the QR menu", async ({ page }) => {
  await page.goto("/m/test-kafe");

  await expect(page.getByRole("heading", { name: "Test Kafe" })).toBeVisible();
  await expect(page.getByText("Latte")).toBeVisible();

  await page.getByRole("button", { name: "Latte ekle" }).click();
  await page.getByRole("link", { name: /Sepete git/ }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("button", { name: "Gel-Al" }).click();
  await page.getByRole("button", { name: "Siparişi onayla" }).click();

  await expect(page).toHaveURL(/\/order\/.+\/pay$/);
  await page.getByRole("button", { name: "Kalem ata" }).click();
  await page.getByRole("button", { name: "Parçaları mock öde" }).click();

  await expect(page.getByText("Ödeme alındı")).toBeVisible();
  await page.getByRole("link", { name: "Siparişi takip et" }).click();
  await expect(
    page.getByRole("heading", { name: "Sipariş takibi" }),
  ).toBeVisible();
});
