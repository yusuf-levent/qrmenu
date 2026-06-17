"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  formatKurus,
  nextStatusByStatus,
  type OrderStatus,
} from "@qrmenu/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiOrder, SOCKET_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelShell } from "./panel-shell";

const lanes: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
const labels: Record<OrderStatus, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  READY: "Hazır",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

export function OrdersPanel() {
  const queryClient = useQueryClient();
  const [newOrderNotice, setNewOrderNotice] = useState<string | null>(null);
  const me = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: api.orders,
    enabled: Boolean(me.data),
  });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.updateOrderStatus(id, status),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  useEffect(() => {
    if (!me.data?.business.id) {
      return;
    }
    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.emit("joinBusiness", me.data.business.id);
    socket.on("order:created", () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      setNewOrderNotice("Yeni sipariş geldi. Liste güncellendi.");
      playBeep();
    });
    socket.on("order:updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    });
    return () => {
      socket.disconnect();
    };
  }, [me.data?.business.id, queryClient]);

  useEffect(() => {
    if (!newOrderNotice) {
      return;
    }
    const timeout = window.setTimeout(() => setNewOrderNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [newOrderNotice]);

  if (me.error) {
    return (
      <PanelShell>
        <Card>
          <CardContent className="pt-5">
            <a className="font-semibold text-primary" href="/panel/login">
              Panele girmek için oturum aç.
            </a>
          </CardContent>
        </Card>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Canlı Siparişler</h1>
        <p className="text-sm text-muted-foreground">
          Yeni siparişler bu ekrana otomatik düşer.
        </p>
      </div>
      {newOrderNotice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          {newOrderNotice}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-4">
        {lanes.map((lane) => (
          <Card key={lane} className="min-h-96">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {labels[lane]}
                <Badge>
                  {orders.data?.filter((order) => order.status === lane)
                    .length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(orders.data ?? [])
                .filter((order) => order.status === lane)
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onNext={(status) =>
                      mutation.mutate({ id: order.id, status })
                    }
                  />
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PanelShell>
  );
}

function OrderCard({
  order,
  onNext,
}: {
  order: ApiOrder;
  onNext: (status: OrderStatus) => void;
}) {
  const next = nextStatusByStatus[order.status];
  return (
    <article className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{order.table?.label ?? "Gel-Al"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString("tr-TR")}
          </p>
        </div>
        <Badge tone={order.type === "DINE_IN" ? "green" : "amber"}>
          {order.type === "DINE_IN" ? "Masa" : "Gel-Al"}
        </Badge>
      </div>
      <ul className="mt-3 grid gap-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.nameSnapshot}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-bold">{formatKurus(order.totalKurus)}</p>
      <div className="mt-3 flex gap-2">
        {next ? (
          <Button size="sm" onClick={() => onNext(next)}>
            {labels[next]}
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => onNext("CANCELLED")}>
          İptal
        </Button>
      </div>
    </article>
  );
}

function playBeep() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.frequency.value = 880;
  gain.gain.value = 0.05;
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
