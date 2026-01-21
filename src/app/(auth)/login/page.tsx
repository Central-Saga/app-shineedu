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
        <Icon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400 pointer-events-none" aria-hidden />
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    console.log("LoginPage Mounted");
  }, []);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      console.log("Global click at:", e.clientX, e.clientY, "Target:", e.target);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-zinc-200 border-t-red-600" />
          <p className="text-zinc-500 font-medium">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      {/* DEBUG BUTTON */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          alert('CLICKED DEBUG TOP');
        }}
        className="fixed top-4 left-4 z-[999999] bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl cursor-pointer pointer-events-auto hover:bg-red-700 active:scale-95 transition-all"
        style={{ pointerEvents: 'auto' }}
      >
        TEST CLICK TOP (v2)
      </button>

      <Card className="relative z-0 w-full max-w-md bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-zinc-900">Login Admin</h1>
          <p className="text-zinc-500">Shine Education Bali</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              className="h-12 text-lg"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-12 text-lg"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full text-lg bg-red-700 hover:bg-red-800"
          >
            {loading ? "Memproses..." : "Masuk Sekarang"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} Shine Education
        </div>
      </Card>
    </div>
  );
}
