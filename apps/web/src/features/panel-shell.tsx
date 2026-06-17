"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListOrdered, QrCode, Settings, Utensils } from "lucide-react";
import { cn } from "@/components/ui/utils";

const nav = [
  { href: "/panel", label: "Canlı Siparişler", icon: ListOrdered },
  { href: "/panel/menu", label: "Menü Yönetimi", icon: Utensils },
  { href: "/panel/tables", label: "Masalar & QR", icon: QrCode },
  { href: "/panel/reports", label: "Rapor", icon: BarChart3 },
  { href: "/panel/settings", label: "Ayarlar", icon: Settings }
];

export function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-border bg-white p-4 md:border-b-0 md:border-r">
          <Link href="/panel" className="text-lg font-bold">
            QR Menu Panel
          </Link>
          <nav className="mt-5 grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="p-4 md:p-6">{children}</section>
      </div>
    </main>
  );
}

