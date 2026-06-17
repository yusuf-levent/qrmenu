"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatKurus } from "@qrmenu/types";
import { api, imageUrl, type Category, type MenuItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { PanelShell } from "./panel-shell";

type ItemForm = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  videoUrl: string;
  sortOrder: string;
  isAvailable: boolean;
};

const emptyItemForm: ItemForm = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  videoUrl: "",
  sortOrder: "0",
  isAvailable: true,
};

export function MenuManagement() {
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
  });
  const items = useQuery({ queryKey: ["menu-items"], queryFn: api.menuItems });
  const [categoryName, setCategoryName] = useState("");
  const [form, setForm] = useState<ItemForm>(emptyItemForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
    ]);
  };

  const createCategory = useMutation({
    mutationFn: () =>
      api.createCategory({
        name: categoryName,
        sortOrder: categories.data?.length ?? 0,
      }),
    onSuccess: async () => {
      setCategoryName("");
      setError(null);
      await refresh();
    },
    onError: (createError) =>
      setError(messageFrom(createError, "Kategori eklenemedi.")),
  });

  const createItem = useMutation({
    mutationFn: async () => {
      const created = await api.createMenuItem({
        categoryId: form.categoryId || categories.data?.[0]?.id || "",
        name: form.name,
        description: form.description || null,
        priceKurus: priceToKurus(form.price),
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        isAvailable: form.isAvailable,
        sortOrder: Number(form.sortOrder),
      });
      if (file) {
        await api.uploadMenuItemImage(created.id, file);
      }
    },
    onSuccess: async () => {
      setForm(emptyItemForm);
      setFile(null);
      setError(null);
      await refresh();
    },
    onError: (createError) =>
      setError(messageFrom(createError, "Ürün kaydedilemedi.")),
  });

  const sortedCategories = useMemo(
    () =>
      [...(categories.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories.data],
  );

  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Kategorileri ve ürünleri düzenle.
        </p>
      </div>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori ekle</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
              <Button
                disabled={!categoryName || createCategory.isPending}
                onClick={() => createCategory.mutate()}
              >
                Ekle
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ürün ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <MenuItemForm
                categories={sortedCategories}
                form={form}
                file={file}
                submitLabel="Ürünü kaydet"
                disabled={!form.name || !form.price || createItem.isPending}
                onFileChange={setFile}
                onFormChange={setForm}
                onSubmit={() => createItem.mutate()}
              />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          {sortedCategories.map((category, index) => (
            <CategoryBlock
              key={category.id}
              category={category}
              items={(items.data ?? []).filter(
                (item) => item.categoryId === category.id,
              )}
              categories={sortedCategories}
              canMoveUp={index > 0}
              canMoveDown={index < sortedCategories.length - 1}
              onError={setError}
              onRefresh={refresh}
            />
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

function CategoryBlock({
  category,
  items,
  categories,
  canMoveUp,
  canMoveDown,
  onError,
  onRefresh,
}: {
  category: Category;
  items: MenuItem[];
  categories: Category[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onError: (message: string | null) => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(category.name);
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));

  async function saveCategory() {
    try {
      await api.updateCategory(category.id, {
        name,
        sortOrder: Number(sortOrder),
      });
      onError(null);
      await onRefresh();
    } catch (updateError) {
      onError(messageFrom(updateError, "Kategori güncellenemedi."));
    }
  }

  async function moveCategory(direction: -1 | 1) {
    try {
      await api.updateCategory(category.id, {
        sortOrder: category.sortOrder + direction,
      });
      onError(null);
      await onRefresh();
    } catch (updateError) {
      onError(messageFrom(updateError, "Kategori sırası güncellenemedi."));
    }
  }

  async function deleteCategory() {
    try {
      await api.deleteCategory(category.id);
      onError(null);
      await onRefresh();
    } catch (deleteError) {
      onError(messageFrom(deleteError, "Kategori silinemedi."));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-48 flex-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            className="w-24"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            aria-label={`${category.name} sırası`}
          />
          <Button size="sm" onClick={saveCategory}>
            Kaydet
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={!canMoveUp}
            onClick={() => moveCategory(-1)}
            aria-label="Yukarı al"
          >
            <ChevronUp data-icon="inline-start" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={!canMoveDown}
            onClick={() => moveCategory(1)}
            aria-label="Aşağı al"
          >
            <ChevronDown data-icon="inline-start" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={deleteCategory}
            aria-label="Kategori sil"
          >
            <Trash2 data-icon="inline-start" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length ? (
          items.map((item) => (
            <EditableItem
              key={item.id}
              item={item}
              categories={categories}
              onError={onError}
              onRefresh={onRefresh}
            />
          ))
        ) : (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Bu kategoride ürün yok.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EditableItem({
  item,
  categories,
  onError,
  onRefresh,
}: {
  item: MenuItem;
  categories: Category[];
  onError: (message: string | null) => void;
  onRefresh: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<ItemForm>(() => ({
    categoryId: item.categoryId,
    name: item.name,
    description: item.description ?? "",
    price: String(item.priceKurus / 100),
    imageUrl: item.imageUrl ?? "",
    videoUrl: item.videoUrl ?? "",
    sortOrder: String(item.sortOrder),
    isAvailable: item.isAvailable,
  }));

  async function saveItem() {
    try {
      await api.updateMenuItem(item.id, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || null,
        priceKurus: priceToKurus(form.price),
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        sortOrder: Number(form.sortOrder),
        isAvailable: form.isAvailable,
      });
      if (file) {
        await api.uploadMenuItemImage(item.id, file);
      }
      setFile(null);
      setIsEditing(false);
      onError(null);
      await onRefresh();
    } catch (updateError) {
      onError(messageFrom(updateError, "Ürün güncellenemedi."));
    }
  }

  async function deleteItem() {
    try {
      await api.deleteMenuItem(item.id);
      onError(null);
      await onRefresh();
    } catch (deleteError) {
      onError(messageFrom(deleteError, "Ürün silinemedi."));
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-border p-3">
        <MenuItemForm
          categories={categories}
          form={form}
          file={file}
          submitLabel="Ürünü güncelle"
          disabled={!form.name || !form.price}
          onFileChange={setFile}
          onFormChange={setForm}
          onSubmit={saveItem}
        />
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => setIsEditing(false)}
        >
          <X data-icon="inline-start" /> Vazgeç
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[64px_1fr_auto]">
      <div className="overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(item.imageUrl) ?? ""}
            alt={item.name}
            className="size-16 object-cover"
          />
        ) : null}
      </div>
      <div>
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-1 text-sm font-bold">{formatKurus(item.priceKurus)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sıra {item.sortOrder} · {item.isAvailable ? "Stokta" : "Kapalı"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil data-icon="inline-start" /> Düzenle
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await api.updateMenuItem(item.id, {
              isAvailable: !item.isAvailable,
            });
            await onRefresh();
          }}
        >
          {item.isAvailable ? "Stok kapat" : "Stok aç"}
        </Button>
        <Button size="sm" variant="destructive" onClick={deleteItem}>
          Sil
        </Button>
      </div>
    </div>
  );
}

function MenuItemForm({
  categories,
  form,
  file,
  submitLabel,
  disabled,
  onFileChange,
  onFormChange,
  onSubmit,
}: {
  categories: Category[];
  form: ItemForm;
  file: File | null;
  submitLabel: string;
  disabled: boolean;
  onFileChange: (file: File | null) => void;
  onFormChange: (form: ItemForm) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field>
        <Label>Kategori</Label>
        <select
          className="h-10 rounded-md border border-border px-3 text-sm"
          value={form.categoryId}
          onChange={(event) =>
            onFormChange({ ...form, categoryId: event.target.value })
          }
        >
          <option value="">Seç</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <Label>Ad</Label>
        <Input
          value={form.name}
          onChange={(event) =>
            onFormChange({ ...form, name: event.target.value })
          }
        />
      </Field>
      <Field>
        <Label>Açıklama</Label>
        <Textarea
          value={form.description}
          onChange={(event) =>
            onFormChange({ ...form, description: event.target.value })
          }
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label>Fiyat (TL)</Label>
          <Input
            value={form.price}
            onChange={(event) =>
              onFormChange({ ...form, price: event.target.value })
            }
          />
        </Field>
        <Field>
          <Label>Sıra</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) =>
              onFormChange({ ...form, sortOrder: event.target.value })
            }
          />
        </Field>
      </div>
      <Field>
        <Label>Görsel URL</Label>
        <Input
          value={form.imageUrl}
          onChange={(event) =>
            onFormChange({ ...form, imageUrl: event.target.value })
          }
        />
      </Field>
      <Field>
        <Label>Görsel yükle</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="text-xs text-muted-foreground">
            Seçili dosya: {file.name}
          </p>
        ) : null}
      </Field>
      <Field>
        <Label>Video URL</Label>
        <Input
          value={form.videoUrl}
          onChange={(event) =>
            onFormChange({ ...form, videoUrl: event.target.value })
          }
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(event) =>
            onFormChange({ ...form, isAvailable: event.target.checked })
          }
        />
        Stokta
      </label>
      <Button disabled={disabled} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}

function priceToKurus(value: string): number {
  const price = Number(value.replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Fiyat geçerli olmalı.");
  }
  return Math.round(price * 100);
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
