"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { formatKurus } from "@qrmenu/types";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Label, Textarea } from "@/components/ui/form";
import {
  CartItem,
  cartTotal,
  clearCart,
  readCart,
  writeCart,
} from "./cart-store";

export function CartView() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [type, setType] = useState<"DINE_IN" | "PICKUP">("DINE_IN");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [returnSlug, setReturnSlug] = useState("test-kafe");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = readCart();
    setReturnSlug(stored[0]?.businessSlug ?? "test-kafe");
    const currentCart = stored.filter(
      (item) => item.businessSlug && item.quantity > 0,
    );
    if (currentCart.length !== stored.length) {
      writeCart(currentCart);
      setInfo("Sepet güncellendi; artık geçerli olmayan ürünler kaldırıldı.");
    }
    setCart(currentCart);
    if (!currentCart[0]?.tableId) {
      setType("PICKUP");
    }
  }, []);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const businessId = cart[0]?.businessId;
  const tableId = cart[0]?.tableId ?? null;
  const tableLabel = cart[0]?.tableLabel ?? null;

  function updateCart(next: CartItem[]) {
    setCart(next);
    writeCart(next);
  }

  async function submit() {
    if (!businessId) {
      setError("Sepet boş");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const order = await api.createOrder({
        businessId,
        type,
        tableId: type === "DINE_IN" ? tableId : null,
        note,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note,
        })),
      });
      clearCart();
      router.push(`/order/${order.id}/pay`);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Sipariş oluşturulamadı";
      if (
        message.includes("stokta yok") ||
        message.includes("bulunamadi") ||
        message.includes("bulunamadı")
      ) {
        clearCart();
        setCart([]);
        setInfo("Sepet güncellendi; artık satışta olmayan ürünler kaldırıldı.");
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <section className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="rounded-lg bg-white p-5">
          <h1 className="text-2xl font-bold">Sepet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tableLabel ? `${tableLabel} için sipariş` : "Gel-al siparişi"}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {info ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {info}
            </p>
          ) : null}
          {!cart.length ? (
            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="font-semibold">Sepette ürün yok</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Menüden ürün seçerek siparişe başlayabilirsin.
              </p>
              <Link
                className="focus-ring mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                href={`/m/${returnSlug}`}
              >
                Menüye dön
              </Link>
            </div>
          ) : null}
          {cart.map((item) => (
            <article
              key={`${item.menuItemId}-${item.note}`}
              className="rounded-lg border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.name}</h2>
                  {item.note ? (
                    <p className="text-sm text-muted-foreground">
                      Not: {item.note}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-bold">
                    {formatKurus(item.priceKurus * item.quantity)}
                  </p>
                </div>
                <button
                  className="focus-ring rounded-md p-2 text-red-600"
                  onClick={() =>
                    updateCart(cart.filter((cartItem) => cartItem !== item))
                  }
                  aria-label={`${item.name} sil`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateCart(
                      cart.map((cartItem) =>
                        cartItem === item
                          ? {
                              ...cartItem,
                              quantity: Math.max(1, cartItem.quantity - 1),
                            }
                          : cartItem,
                      ),
                    )
                  }
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm font-semibold">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateCart(
                      cart.map((cartItem) =>
                        cartItem === item
                          ? { ...cartItem, quantity: cartItem.quantity + 1 }
                          : cartItem,
                      ),
                    )
                  }
                >
                  +
                </Button>
              </div>
            </article>
          ))}
        </div>
        {cart.length ? (
          <>
            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="font-semibold">Sipariş tipi</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant={type === "DINE_IN" ? "default" : "outline"}
                  disabled={!tableId}
                  onClick={() => setType("DINE_IN")}
                >
                  Masada
                </Button>
                <Button
                  variant={type === "PICKUP" ? "default" : "outline"}
                  onClick={() => setType("PICKUP")}
                >
                  Gel-Al
                </Button>
              </div>
              {type === "PICKUP" ? (
                <Badge className="mt-3">Tahmini hazırlık: 15-20 dakika</Badge>
              ) : null}
              <Field className="mt-4">
                <Label>Genel not</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </div>
            <div className="sticky bottom-0 rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between text-lg font-bold">
                <span>Toplam</span>
                <span>{formatKurus(total)}</span>
              </div>
              {error ? (
                <p className="mb-3 text-sm text-red-600">{error}</p>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                onClick={submit}
              >
                Siparişi onayla
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
