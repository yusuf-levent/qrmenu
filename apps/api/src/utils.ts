import { randomBytes } from "crypto";
import path from "path";

export function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function createToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function sanitizeUploadName(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  return `${createToken(12)}${extension}`;
}

export function publicMenuBaseUrl(): string {
  return process.env.PUBLIC_MENU_BASE_URL ?? "http://localhost:3000";
}

