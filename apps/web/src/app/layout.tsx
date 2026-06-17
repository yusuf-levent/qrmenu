import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/features/query-provider";

export const metadata: Metadata = {
  title: "QR Menu",
  description: "QR menu ve siparis platformu"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

