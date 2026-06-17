"use client";

import type { PublicMenuItem } from "@qrmenu/types";

export type CartItem = {
  menuItemId: string;
  businessId: string;
  businessSlug: string;
  tableId: string | null;
  tableLabel: string | null;
  name: string;
  priceKurus: number;
  imageUrl: string | null;
  quantity: number;
  note: string;
};

const key = "qrmenu_cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(cart: CartItem[]) {
  window.localStorage.setItem(key, JSON.stringify(cart));
}

export function clearCart() {
  window.localStorage.removeItem(key);
}

export function upsertCartItem(
  cart: CartItem[],
  item: PublicMenuItem,
  context: {
    businessId: string;
    businessSlug: string;
    tableId: string | null;
    tableLabel: string | null;
  },
  quantity: number,
  note: string,
): CartItem[] {
  const existing = cart.find(
    (cartItem) => cartItem.menuItemId === item.id && cartItem.note === note,
  );
  if (existing) {
    return cart.map((cartItem) =>
      cartItem === existing
        ? { ...cartItem, quantity: cartItem.quantity + quantity }
        : cartItem,
    );
  }
  return [
    ...cart,
    {
      menuItemId: item.id,
      businessId: context.businessId,
      businessSlug: context.businessSlug,
      tableId: context.tableId,
      tableLabel: context.tableLabel,
      name: item.name,
      priceKurus: item.priceKurus,
      imageUrl: item.imageUrl,
      quantity,
      note,
    },
  ];
}

export function cartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.priceKurus * item.quantity, 0);
}

export function cartCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
