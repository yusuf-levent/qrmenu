"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { PanelShell } from "./panel-shell";

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business"], queryFn: api.business });
  const [form, setForm] = useState({ name: "", logoUrl: "", address: "", phone: "" });
  useEffect(() => {
    if (business.data) {
      setForm({
        name: business.data.name,
        logoUrl: business.data.logoUrl ?? "",
        address: business.data.address ?? "",
        phone: business.data.phone ?? ""
      });
    }
  }, [business.data]);
  const save = useMutation({
    mutationFn: () =>
      api.updateBusiness({
        name: form.name,
        logoUrl: form.logoUrl || null,
        address: form.address || null,
        phone: form.phone || null
      }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["business"] })
  });
  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">İşletme bilgilerini güncelle.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>İşletme</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <Label>Ad</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field>
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} />
          </Field>
          <Field>
            <Label>Adres</Label>
            <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </Field>
          <Field>
            <Label>Telefon</Label>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Button onClick={() => save.mutate()}>Kaydet</Button>
        </CardContent>
      </Card>
    </PanelShell>
  );
}

