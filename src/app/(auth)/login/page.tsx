"use client";

import { useEffect, useState } from "react";
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
import { CheckCircle2, Loader2, Lock, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type Form = z.infer<typeof schema>;

const BULLETS = [
  "Kelola pengguna & role",
  "Atur permission per modul",
  "Audit & kontrol akses",
];

function InputWithIcon({
  id,
  type,
  placeholder,
  autoComplete,
  icon: Icon,
  error,
  ...rest
}: {
  id: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  icon: React.ElementType;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 rounded-lg border-zinc-200/80 bg-white pl-10 focus-visible:ring-2 focus-visible:ring-[#A4001D]/30 focus-visible:border-[#A4001D]/50"
          {...rest}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

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

  // Redirect ke dashboard jika sudah login (mis. user Back dari protected ke /login)
  useEffect(() => {
    if (authStore.getState().token) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(values: Form) {
    setLoading(true);
    try {
      await authStore.login(values.email, values.password);
      router.push("/dashboard");
    } catch {
      // Error di-toast oleh httpClient (401/403/422)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fff5f5] via-white to-[#fff9e6]">
      {/* Global blobs */}
      <div
        className="pointer-events-none absolute -left-48 -top-48 h-96 w-96 rounded-full bg-[#A4001D]/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-48 h-[28rem] w-[28rem] rounded-full bg-[#F5B700]/[0.05] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1180px] flex-col-reverse px-4 py-8 sm:px-6 lg:flex-row lg:px-8 xl:px-10">
        {/* Left: Branding — 45% on desktop */}
        <aside className="flex shrink-0 flex-col justify-center px-8 py-8 lg:flex-[0.45] lg:px-10 lg:py-12">
          <Image
            src="/shine-logo.png"
            alt="Shine Education"
            width={180}
            height={52}
            className="mb-6 object-contain object-left"
            priority
          />
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
            Shine Edu Admin Panel
          </h1>
          <p className="mt-3 max-w-md text-zinc-500">
            Satu dashboard untuk operasi RBAC: kelola pengguna, role, dan permission dengan akses aman berbasis peran.
          </p>
          <ul className="mt-6 space-y-3">
            {BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-zinc-600">
                <CheckCircle2 className="size-5 shrink-0 text-[#A4001D]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-zinc-400">
            Secure access with role-based permissions.
          </p>
        </aside>

        {/* Right: Login card — 55% on desktop */}
        <section className="relative flex min-h-0 flex-1 items-center justify-center py-8 lg:flex-[0.55] lg:py-12">
          {/* Glow blobs behind card */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#A4001D]/[0.08] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-1/4 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#F5B700]/[0.06] blur-3xl"
            aria-hidden
          />

          <Card
            className={[
              "relative z-10 w-full max-w-[460px] rounded-2xl border border-zinc-200/60 p-6 lg:p-8",
              "bg-white/80 shadow-[0_4px_14px_0_rgba(0,0,0,0.05),0_12px_32px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm",
              "animate-in fade-in-0 zoom-in-95 duration-300",
            ].join(" ")}
          >
            <CardHeader className="space-y-1 pb-4 !px-0 pt-0">
              <CardTitle className="text-2xl font-semibold">Login</CardTitle>
              <CardDescription>Masuk ke Admin Panel Shine Education</CardDescription>
            </CardHeader>
            <CardContent className="!px-0 pb-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700">Email</Label>
                  <InputWithIcon
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    autoComplete="email"
                    icon={Mail}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700">Password</Label>
                  <InputWithIcon
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    icon={Lock}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className={[
                    "h-12 w-full rounded-lg font-medium text-white transition-all",
                    "bg-gradient-to-r from-[#A4001D] to-[#C9002A]",
                    "hover:brightness-110 active:scale-[0.99]",
                    "focus-visible:ring-2 focus-visible:ring-[#A4001D]/30",
                  ].join(" ")}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" aria-hidden />
                      Memproses…
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-zinc-400">
                © Shine Education
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
