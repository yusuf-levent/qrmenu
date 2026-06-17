"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatKurus, type OrderStatus } from "@qrmenu/types";
import { api, SOCKET_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];
const labels: Record<OrderStatus, string> = {
  PENDING: "Alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  READY: "Hazır",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal"
};

export function TrackingView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["order", id], queryFn: () => api.getOrder(id) });
  const order = query.data;

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.emit("joinOrder", id);
    socket.on("order:updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
    });
    return () => {
      socket.disconnect();
    };
  }, [id, queryClient]);

  if (!order) {
    return <main className="grid min-h-screen place-items-center bg-muted p-6">Sipariş yükleniyor...</main>;
  }

  const activeIndex = statuses.indexOf(order.status);

  return (
    <main className="min-h-screen bg-muted p-4">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sipariş takibi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sipariş #{order.id.slice(-6)}</p>
          </div>
          <Badge tone={order.status === "READY" ? "amber" : "green"}>{labels[order.status]}</Badge>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {statuses.map((status, index) => {
            const complete = activeIndex >= index;
            return (
              <div key={status} className="flex items-center gap-3">
                <div
                  className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                    complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={complete ? "font-semibold" : "text-muted-foreground"}>{labels[status]}</span>
              </div>
            );
          })}
        </div>
        {order.type === "PICKUP" && order.status === "READY" ? (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 font-semibold text-amber-900">
            Siparişin hazır, alabilirsin!
          </div>
        ) : null}
        <div className="mt-8 border-t border-border pt-4 text-sm">
          <p className="font-bold">Toplam: {formatKurus(order.totalKurus)}</p>
          <p className="mt-1 text-muted-foreground">
            {order.items.map((item) => `${item.quantity}x ${item.nameSnapshot}`).join(", ")}
          </p>
        </div>
      </section>
    </main>
  );
}

