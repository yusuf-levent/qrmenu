"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play, Plus, X } from "lucide-react";
import type { PublicMenuItem, PublicMenuResponse } from "@qrmenu/types";
import { formatKurus } from "@qrmenu/types";
import { useQuery } from "@tanstack/react-query";
import { api, imageUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { cartCount, cartTotal, readCart, upsertCartItem, writeCart } from "./cart-store";

export function CustomerMenu({ mode, value }: { mode: "slug" | "table"; value: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [cart, setCart] = useState(readCart);
  const [showBanner, setShowBanner] = useState(true);

  const query = useQuery({
    queryKey: ["public-menu", mode, value],
    queryFn: () => (mode === "slug" ? api.publicMenuBySlug(value) : api.publicMenuByTable(value))
  });

  const data = query.data;
  const activeCategory = selectedCategory ?? data?.categories[0]?.id ?? null;

  function addToCart(item: PublicMenuItem, quantity = 1, note = "") {
    if (!data) {
      return;
    }
    const next = upsertCartItem(
      cart,
      item,
      {
        businessId: data.business.id,
        tableId: data.table?.id ?? null,
        tableLabel: data.table?.label ?? null
      },
      quantity,
      note
    );
    setCart(next);
    writeCart(next);
  }

  if (query.isLoading) {
    return <MenuShell>Menü yükleniyor...</MenuShell>;
  }
  if (query.error || !data) {
    return <MenuShell>Menü bulunamadı.</MenuShell>;
  }

  return (
    <main className="min-h-screen bg-muted">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col bg-white">
        <MenuHeader data={data} />
        <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-border bg-white px-4 py-3">
          {data.categories.map((category) => (
            <button
              key={category.id}
              className={`focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
                activeCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 p-4 pb-32">
          {data.categories
            .filter((category) => category.id === activeCategory)
            .flatMap((category) => category.items)
            .map((item) => (
              <ProductRow
                key={item.id}
                item={item}
                onAdd={() => addToCart(item)}
                onOpen={() => setSelectedItem(item)}
              />
            ))}
        </div>
        {showBanner ? (
          <div className="mx-4 mb-24 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <button className="float-right" aria-label="Banner kapat" onClick={() => setShowBanner(false)}>
              <X size={16} />
            </button>
            Puan kazan, daha hızlı sipariş ver → Uygulamayı indir
          </div>
        ) : null}
        <CartBar count={cartCount(cart)} total={cartTotal(cart)} />
      </section>
      {selectedItem ? (
        <ProductSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={(quantity, note) => {
            addToCart(selectedItem, quantity, note);
            setSelectedItem(null);
          }}
        />
      ) : null}
    </main>
  );
}

function MenuShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="rounded-lg bg-white p-6 text-sm text-muted-foreground">{children}</div>
    </main>
  );
}

function MenuHeader({ data }: { data: PublicMenuResponse }) {
  return (
    <header className="flex items-center gap-4 border-b border-border p-4">
      {data.business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl(data.business.logoUrl) ?? ""}
          alt={data.business.name}
          className="size-14 rounded-lg object-cover"
        />
      ) : (
        <div className="grid size-14 place-items-center rounded-lg bg-muted font-semibold">
          {data.business.name.slice(0, 2)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{data.business.name}</h1>
        <p className="truncate text-sm text-muted-foreground">{data.business.address ?? "QR menü"}</p>
      </div>
      {data.table ? <Badge tone="green">{data.table.label}</Badge> : null}
    </header>
  );
}

function ProductRow({
  item,
  onAdd,
  onOpen
}: {
  item: PublicMenuItem;
  onAdd: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg border border-border p-3">
      <button className="relative overflow-hidden rounded-md bg-muted" onClick={onOpen}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(item.imageUrl) ?? ""} alt={item.name} className="size-[72px] object-cover" />
        ) : (
          <div className="grid size-[72px] place-items-center text-xs text-muted-foreground">Görsel</div>
        )}
        {item.videoUrl ? (
          <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
            <Play size={18} fill="currentColor" />
          </span>
        ) : null}
      </button>
      <button className="min-w-0 text-left" onClick={onOpen}>
        <h2 className="truncate text-sm font-semibold">{item.name}</h2>
        <p className="truncate text-sm text-muted-foreground">{item.description ?? "Açıklama yok"}</p>
        <p className="mt-1 text-sm font-bold">{formatKurus(item.priceKurus)}</p>
      </button>
      <Button size="icon" onClick={onAdd} aria-label={`${item.name} ekle`}>
        <Plus data-icon="inline-start" />
      </Button>
    </article>
  );
}

function CartBar({ count, total }: { count: number; total: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white p-4">
      <div className="mx-auto max-w-3xl">
        <Link
          className="focus-ring flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href="/cart"
        >
          {count} ürün · {formatKurus(total)} · Sepete git
        </Link>
      </div>
    </div>
  );
}

function ProductSheet({
  item,
  onClose,
  onAdd
}: {
  item: PublicMenuItem;
  onClose: () => void;
  onAdd: (quantity: number, note: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const total = useMemo(() => item.priceKurus * quantity, [item.priceKurus, quantity]);
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-6">
      <section className="max-h-[92vh] w-full overflow-auto rounded-t-lg bg-white sm:max-w-lg sm:rounded-lg">
        {item.videoUrl ? (
          <video src={item.videoUrl} controls muted className="aspect-video w-full bg-black object-cover" />
        ) : item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(item.imageUrl) ?? ""} alt={item.name} className="aspect-video w-full object-cover" />
        ) : null}
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{item.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
            <button className="focus-ring rounded-md p-2" onClick={onClose} aria-label="Kapat">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-bold">{formatKurus(item.priceKurus)}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                +
              </Button>
            </div>
          </div>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Not: sos az olsun vb."
          />
          <Button size="lg" onClick={() => onAdd(quantity, note)}>
            Sepete ekle ({formatKurus(total)})
          </Button>
        </div>
      </section>
    </div>
  );
}
