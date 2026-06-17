"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatKurus } from "@qrmenu/types";
import { api, imageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { PanelShell } from "./panel-shell";

export function MenuManagement() {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const items = useQuery({ queryKey: ["menu-items"], queryFn: api.menuItems });
  const [categoryName, setCategoryName] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    videoUrl: "",
    sortOrder: "0"
  });
  const [file, setFile] = useState<File | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
    ]);
  };

  const createCategory = useMutation({
    mutationFn: () => api.createCategory({ name: categoryName, sortOrder: categories.data?.length ?? 0 }),
    onSuccess: async () => {
      setCategoryName("");
      await refresh();
    }
  });

  const createItem = useMutation({
    mutationFn: async () => {
      const created = await api.createMenuItem({
        categoryId: form.categoryId || categories.data?.[0]?.id || "",
        name: form.name,
        description: form.description || null,
        priceKurus: Math.round(Number(form.price.replace(",", ".")) * 100),
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        isAvailable: true,
        sortOrder: Number(form.sortOrder)
      });
      if (file) {
        await api.uploadMenuItemImage(created.id, file);
      }
    },
    onSuccess: async () => {
      setForm({ categoryId: "", name: "", description: "", price: "", imageUrl: "", videoUrl: "", sortOrder: "0" });
      setFile(null);
      await refresh();
    }
  });

  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
        <p className="text-sm text-muted-foreground">Kategorileri ve ürünleri düzenle.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori ekle</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
              <Button disabled={!categoryName} onClick={() => createCategory.mutate()}>
                Ekle
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ürün ekle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field>
                <Label>Kategori</Label>
                <select
                  className="h-10 rounded-md border border-border px-3 text-sm"
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                >
                  <option value="">Seç</option>
                  {(categories.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <Label>Ad</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field>
                <Label>Açıklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </Field>
              <Field>
                <Label>Fiyat (TL)</Label>
                <Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </Field>
              <Field>
                <Label>Görsel URL</Label>
                <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
              </Field>
              <Field>
                <Label>Görsel yükle</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </Field>
              <Field>
                <Label>Video URL</Label>
                <Input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} />
              </Field>
              <Button disabled={!form.name || !form.price} onClick={() => createItem.mutate()}>
                Ürünü kaydet
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          {(categories.data ?? []).map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(items.data ?? [])
                  .filter((item) => item.categoryId === category.id)
                  .map((item) => (
                    <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[64px_1fr_auto]">
                      <div className="overflow-hidden rounded-md bg-muted">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl(item.imageUrl) ?? ""} alt={item.name} className="size-16 object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-sm font-bold">{formatKurus(item.priceKurus)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await api.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
                            await refresh();
                          }}
                        >
                          {item.isAvailable ? "Stok kapat" : "Stok aç"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await api.deleteMenuItem(item.id);
                            await refresh();
                          }}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

