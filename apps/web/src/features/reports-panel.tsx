"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { formatKurus } from "@qrmenu/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelShell } from "./panel-shell";

export function ReportsPanel() {
  const reports = useQuery({ queryKey: ["reports"], queryFn: api.reports });
  const data = reports.data;
  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Basit Rapor</h1>
        <p className="text-sm text-muted-foreground">Bugün ve bu hafta satış özeti.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Bugünkü sipariş" value={String(data?.todayOrderCount ?? 0)} />
        <Metric title="Bugünkü ciro" value={formatKurus(data?.todayRevenueKurus ?? 0)} />
        <Metric title="Haftalık sipariş" value={String(data?.weekOrderCount ?? 0)} />
        <Metric title="Haftalık ciro" value={formatKurus(data?.weekRevenueKurus ?? 0)} />
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>En çok satan 5 ürün</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data?.topItems.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Rapor için henüz sipariş yok.
            </div>
          )}
        </CardContent>
      </Card>
    </PanelShell>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
