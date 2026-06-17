"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { PanelShell } from "./panel-shell";

export function TablesPanel() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const tables = useQuery({ queryKey: ["tables"], queryFn: api.tables });
  const create = useMutation({
    mutationFn: () => api.createTable(label),
    onSuccess: async () => {
      setLabel("");
      await queryClient.invalidateQueries({ queryKey: ["tables"] });
    }
  });

  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Masalar & QR</h1>
        <p className="text-sm text-muted-foreground">Masa ekle, QR kodu indir veya yazdır.</p>
      </div>
      <Card className="mb-4">
        <CardContent className="flex gap-2 pt-5">
          <Input placeholder="Masa 6" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Button disabled={!label} onClick={() => create.mutate()}>
            Ekle
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(tables.data ?? []).map((table) => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle>{table.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${API_BASE}/tables/${table.id}/qr`} alt={`${table.label} QR`} className="aspect-square w-full rounded-md bg-white" />
              <div className="flex gap-2">
                <a
                  className="focus-ring inline-flex h-10 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold"
                  href={`${API_BASE}/tables/${table.id}/qr`}
                  download={`${table.label}.png`}
                >
                  PNG indir
                </a>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`${API_BASE}/tables/${table.id}/qr`, "_blank")}
                  aria-label="Yazdır"
                >
                  <Printer data-icon="inline-start" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PanelShell>
  );
}

