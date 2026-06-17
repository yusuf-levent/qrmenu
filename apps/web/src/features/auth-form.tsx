"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? "owner@testkafe.local" : "");
  const [password, setPassword] = useState(mode === "login" ? "Test12345!" : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.register(businessName, email, password);
      } else {
        await api.login(email, password);
      }
      router.push("/panel");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Giriş başarısız");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "register" ? "İşletme kaydı" : "Panel girişi"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {mode === "register" ? (
              <Field>
                <Label>İşletme adı</Label>
                <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
              </Field>
            ) : null}
            <Field>
              <Label>E-posta</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field>
              <Label>Şifre</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Field>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={pending}>{mode === "register" ? "Kaydol" : "Giriş yap"}</Button>
          </form>
          <Link
            className="mt-4 block text-sm font-semibold text-primary"
            href={mode === "register" ? "/panel/login" : "/panel/register"}
          >
            {mode === "register" ? "Zaten hesabım var" : "Yeni işletme kaydı"}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

