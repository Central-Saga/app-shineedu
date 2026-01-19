"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Form) {
    setLoading(true);
    try {
      await authStore.login(values.email, values.password);
      router.push("/dashboard");
    } catch {
      // Error sudah di-toast oleh httpClient (401/403/422)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white to-slate-50">
      {/* Decorative shapes */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full bg-red-200/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-red-200/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* Branding panel - kiri, desktop only */}
        <div className="hidden flex-1 flex-col justify-center px-8 py-12 lg:flex lg:px-12 xl:px-16">
          <Image
            src="/shine-logo.png"
            alt="Shine Education"
            width={220}
            height={64}
            className="mb-8 object-contain object-left"
          />
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900 xl:text-3xl">
            Shine Edu Admin Panel
          </h2>
          <ul className="space-y-3">
            {[
              "Kelola pengguna & role",
              "Atur permission per modul",
              "Audit & kontrol akses",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-slate-600">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="size-3 text-primary" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            Secure access with role-based permissions.
          </p>
        </div>

        {/* Form - kanan / tengah mobile */}
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md rounded-2xl border-slate-200/60 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Login</CardTitle>
              <CardDescription>Masuk ke Admin Panel Shine Education</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses…" : "Login"}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-slate-400">
                © Shine Education
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
