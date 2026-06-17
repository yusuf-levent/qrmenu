import type {
  OrderStatus,
  PublicMenuResponse,
  CreateOrderInput,
  PayOrderInput
} from "@qrmenu/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE;

export type ApiOrder = {
  id: string;
  businessId: string;
  tableId: string | null;
  type: "DINE_IN" | "PICKUP";
  status: OrderStatus;
  totalKurus: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  table?: { id: string; label: string } | null;
  items: {
    id: string;
    nameSnapshot: string;
    priceKurusSnapshot: number;
    quantity: number;
    note: string | null;
  }[];
  payments: { id: string; amountKurus: number; status: string; payerLabel: string | null }[];
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceKurus: number;
  imageUrl: string | null;
  videoUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
};

export type Table = {
  id: string;
  label: string;
  qrToken: string;
};

export type MeResponse = {
  user: { id: string; email: string; role: string; businessId: string };
  business: { id: string; name: string; slug: string; logoUrl: string | null; address: string | null; phone: string | null };
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: "Islem basarisiz" }))) as {
      message?: string;
    };
    throw new Error(error.message ?? "Islem basarisiz");
  }
  return (await response.json()) as T;
}

export function imageUrl(src: string | null): string | null {
  if (!src) {
    return null;
  }
  if (src.startsWith("http")) {
    return src;
  }
  return `${API_BASE}${src}`;
}

export const api = {
  publicMenuBySlug: (slug: string) => apiFetch<PublicMenuResponse>(`/public/menu/${slug}`),
  publicMenuByTable: (token: string) => apiFetch<PublicMenuResponse>(`/public/table/${token}`),
  createOrder: (input: CreateOrderInput) =>
    apiFetch<ApiOrder>("/orders", { method: "POST", body: JSON.stringify(input) }),
  getOrder: (id: string) => apiFetch<ApiOrder>(`/orders/${id}`),
  payOrder: (id: string, input: PayOrderInput) =>
    apiFetch<ApiOrder>(`/orders/${id}/pay`, { method: "POST", body: JSON.stringify(input) }),
  login: (email: string, password: string) =>
    apiFetch<MeResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (businessName: string, email: string, password: string) =>
    apiFetch<MeResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ businessName, email, password })
    }),
  me: () => apiFetch<MeResponse>("/auth/me"),
  business: () => apiFetch<MeResponse["business"]>("/businesses/me"),
  updateBusiness: (input: Partial<MeResponse["business"]>) =>
    apiFetch<MeResponse["business"]>("/businesses/me", { method: "PATCH", body: JSON.stringify(input) }),
  categories: () => apiFetch<Category[]>("/categories"),
  createCategory: (input: { name: string; sortOrder: number }) =>
    apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id: string, input: Partial<Category>) =>
    apiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteCategory: (id: string) => apiFetch<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
  menuItems: () => apiFetch<MenuItem[]>("/menu-items"),
  createMenuItem: (input: Omit<MenuItem, "id">) =>
    apiFetch<MenuItem>("/menu-items", { method: "POST", body: JSON.stringify(input) }),
  updateMenuItem: (id: string, input: Partial<MenuItem>) =>
    apiFetch<MenuItem>(`/menu-items/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  uploadMenuItemImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`${API_BASE}/menu-items/${id}/image`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: "Yukleme basarisiz" }))) as {
        message?: string;
      };
      throw new Error(error.message ?? "Yukleme basarisiz");
    }
    return (await response.json()) as MenuItem;
  },
  deleteMenuItem: (id: string) => apiFetch<{ ok: boolean }>(`/menu-items/${id}`, { method: "DELETE" }),
  tables: () => apiFetch<Table[]>("/tables"),
  createTable: (label: string) =>
    apiFetch<Table>("/tables", { method: "POST", body: JSON.stringify({ label }) }),
  deleteTable: (id: string) => apiFetch<{ ok: boolean }>(`/tables/${id}`, { method: "DELETE" }),
  orders: () => apiFetch<ApiOrder[]>("/orders"),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    apiFetch<ApiOrder>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  reports: () =>
    apiFetch<{
      todayOrderCount: number;
      todayRevenueKurus: number;
      weekOrderCount: number;
      weekRevenueKurus: number;
      topItems: { name: string; quantity: number }[];
    }>("/reports/summary")
};
