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

type SplitMode = "equal" | "items";

export function PaymentView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [splitCount, setSplitCount] = useState(2);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [itemPayers, setItemPayers] = useState<Record<string, number>>({});
  const [paid, setPaid] = useState(false);
  const query = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.getOrder(id),
  });
  const order = query.data;

  const splitAmounts = useMemo(
    () => (order ? createEqualSplits(order.totalKurus, splitCount) : []),
    [order, splitCount],
  );

  const itemSplitAmounts = useMemo(() => {
    const amounts = Array.from({ length: splitCount }, () => 0);
    if (!order) {
      return amounts;
    }
    for (const item of order.items) {
      const payerIndex = Math.min(itemPayers[item.id] ?? 0, splitCount - 1);
      amounts[payerIndex] =
        (amounts[payerIndex] ?? 0) + item.priceKurusSnapshot * item.quantity;
    }
    return amounts;
  }, [itemPayers, order, splitCount]);

  const paidTotal = useMemo(
    () =>
      order?.payments
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + payment.amountKurus, 0) ?? 0,
    [order?.payments],
  );
  const isPaid = paid || (order ? paidTotal >= order.totalKurus : false);

  const mutation = useMutation({
    mutationFn: (mode: "single" | SplitMode) => {
      const amounts = mode === "items" ? itemSplitAmounts : splitAmounts;
      return api.payOrder(
        id,
        mode === "single"
          ? {}
          : {
              splits: amounts
                .map((amountKurus, index) => ({
                  payerLabel: `Kişi ${index + 1}`,
                  amountKurus,
                }))
                .filter((split) => split.amountKurus > 0),
            },
      );
    },
    onSuccess: async () => {
      setPaid(true);
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });

  if (query.isLoading) {
    return <PaymentShell>Ödeme bilgisi yükleniyor...</PaymentShell>;
  }
  if (!order) {
    return <PaymentShell>Sipariş bulunamadı.</PaymentShell>;
  }

  const activeSplitAmounts =
    splitMode === "items" ? itemSplitAmounts : splitAmounts;

  return (
    <main className="min-h-screen bg-muted p-4">
      <section className="mx-auto flex max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ödeme</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.quantity}x {item.nameSnapshot}
                </span>
                <span>
                  {formatKurus(item.priceKurusSnapshot * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-3 text-lg font-bold">
              Toplam: {formatKurus(order.totalKurus)}
            </div>
            {isPaid ? (
              <p className="text-sm font-semibold text-emerald-700">
                Bu siparişin ödemesi tamamlandı.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tek öde</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              disabled={mutation.isPending || isPaid}
              onClick={() => mutation.mutate("single")}
            >
              {formatKurus(order.totalKurus)} öde
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hesabı böl</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={splitMode === "equal" ? "default" : "outline"}
                onClick={() => setSplitMode("equal")}
              >
                Eşit böl
              </Button>
              <Button
                type="button"
                variant={splitMode === "items" ? "default" : "outline"}
                onClick={() => setSplitMode("items")}
              >
                Kalem ata
              </Button>
            </div>
            <Field>
              <Label>Kişi sayısı</Label>
              <Input
                type="number"
                min={2}
                max={12}
                value={splitCount}
                onChange={(event) =>
                  setSplitCount(Math.max(2, Number(event.target.value)))
                }
              />
            </Field>
            {splitMode === "items" ? (
              <div className="grid gap-2 rounded-lg border border-border p-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-[1fr_140px]"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {item.quantity}x {item.nameSnapshot}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatKurus(item.priceKurusSnapshot * item.quantity)}
                      </p>
                    </div>
                    <select
                      className="h-10 rounded-md border border-border bg-white px-3 text-sm"
                      value={Math.min(itemPayers[item.id] ?? 0, splitCount - 1)}
                      onChange={(event) =>
                        setItemPayers((current) => ({
                          ...current,
                          [item.id]: Number(event.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: splitCount }, (_value, index) => (
                        <option key={index} value={index}>
                          Kişi {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="grid gap-2">
              {activeSplitAmounts.map((amount, index) => (
                <div
                  key={index}
                  className="flex justify-between rounded-md bg-muted p-3 text-sm"
                >
                  <span>Kişi {index + 1}</span>
                  <span>{formatKurus(amount)}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              disabled={mutation.isPending || isPaid}
              onClick={() => mutation.mutate(splitMode)}
            >
              Parçaları mock öde
            </Button>
          </CardContent>
        </Card>
        {isPaid ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CheckCircle2 className="mb-2" />
            <p className="font-bold">Ödeme alındı ✓</p>
            <Link
              className="mt-3 inline-flex text-sm font-semibold underline"
              href={`/order/${id}`}
            >
              Siparişi takip et
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted p-6">
      {children}
    </main>
  );
}
