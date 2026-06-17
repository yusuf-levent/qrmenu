import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted p-6">
      <section className="max-w-md rounded-lg bg-white p-6 text-center">
        <h1 className="text-2xl font-bold">QR Menu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Yerel MVP hazır olduğunda demo menüden başlayabilirsin.</p>
        <Link
          href="/m/test-kafe"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Test Kafe menüsünü aç
        </Link>
      </section>
    </main>
  );
}
