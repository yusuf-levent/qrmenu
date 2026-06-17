import type { PublicMenuResponse } from "@qrmenu/types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getPublicMenu(slug: string): Promise<PublicMenuResponse> {
  const response = await fetch(`${API_BASE}/public/menu/${slug}`);
  if (!response.ok) {
    throw new Error("Menu yuklenemedi");
  }
  return (await response.json()) as PublicMenuResponse;
}

