"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createEqualSplits, formatKurus } from "@qrmenu/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";

export function PaymentView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [splitCount, setSplitCount] = useState(2);
  const [paid, setPaid] = useState(false);
  const query = useQuery({ queryKey: ["order", id], queryFn: () => api.getOrder(id) });
  const order = query.data;

  const splitAmounts = useMemo(
    () => (order ? createEqualSplits(order.totalKurus, splitCount) : []),
    [order, splitCount]
  );

  const mutation = useMutation({
    mutationFn: (mode: "single" | "split") =>
      api.payOrder(
        id,
        mode === "split"
          ? {
              splits: splitAmounts.map((amountKurus, index) => ({
                payerLabel: `Kişi ${index + 1}`,
                amountKurus
              }))
            }
          : {}
      ),
    onSuccess: async () => {
      setPaid(true);
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
    }
  });

  if (query.isLoading) {
    return <PaymentShell>Ödeme bilgisi yükleniyor...</PaymentShell>;
  }
  if (!order) {
    return <PaymentShell>Sipariş bulunamadı.</PaymentShell>;
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <section className="mx-auto flex max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ödeme</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.nameSnapshot}
                </span>
                <span>{formatKurus(item.priceKurusSnapshot * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 text-lg font-bold">
              Toplam: {formatKurus(order.totalKurus)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tek öde</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate("single")}>
              {formatKurus(order.totalKurus)} öde
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hesabı böl</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <Label>Kişi sayısı</Label>
              <Input
                type="number"
                min={2}
                max={12}
                value={splitCount}
                onChange={(event) => setSplitCount(Math.max(2, Number(event.target.value)))}
              />
            </Field>
            <div className="grid gap-2">
              {splitAmounts.map((amount, index) => (
                <div key={index} className="flex justify-between rounded-md bg-muted p-3 text-sm">
                  <span>Kişi {index + 1}</span>
                  <span>{formatKurus(amount)}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate("split")}>
              Parçaları mock öde
            </Button>
          </CardContent>
        </Card>
        {paid ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CheckCircle2 className="mb-2" />
            <p className="font-bold">Ödeme alındı ✓</p>
            <Link className="mt-3 inline-flex text-sm font-semibold underline" href={`/order/${id}`}>
              Siparişi takip et
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-muted p-6">{children}</main>;
}

