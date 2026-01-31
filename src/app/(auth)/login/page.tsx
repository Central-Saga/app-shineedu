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
import { Loader2, Lock, Mail, ChevronRight } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email / Kode wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

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
      // Error handles by httpClient
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Left Panel: Light Futuristic Branding (Aligned with Dashboard) */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-center p-16 overflow-hidden bg-muted/20">
        {/* Abstract Background Elements - Dashboard Aligned */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,var(--background)_100%)]" />
          
          {/* Futuristic Grid Pattern - Very Low Opacity */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center lg:items-start space-y-12 max-w-xl mx-auto">
          {/* Official Logo Integration */}
          <div className="mb-4">
             <Image 
               src="/shine-logo.png" 
               alt="Shine Education Logo" 
               width={160} 
               height={60} 
               className="h-auto brightness-95 opacity-90"
               priority
             />
          </div>

          {/* Illustration Integration */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
            <Image 
              src="/login.svg" 
              alt="Login Illustration" 
              fill
              className="object-contain relative z-10"
              priority
            />
          </div>
          
          <div className="space-y-4 text-left w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Admin Gateway</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">
              Management <br />
              <span className="text-primary tracking-tighter italic">Intelligence System</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm opacity-80">
              Integrasi cerdas untuk efisiensi pendidikan di Bali &bull; Shine Education Bali.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Clean Login Form (Standard Shadcn Sizes) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-background relative z-10">
        {/* Subtle glow behind the form for depth without a line */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-96 bg-primary/5 blur-[100px] pointer-events-none hidden lg:block" />
        
        <div className="w-full max-w-[340px] relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-black tracking-tighter text-foreground mb-1.5">Selamat Datang</h2>
            <p className="text-muted-foreground text-xs font-medium">Silakan masuk untuk akses dashboard admin</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground/70 font-bold text-[10px] uppercase tracking-wider ml-0.5">Email / Kode</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Email, Kode Murid, atau Kode Karyawan"
                  className="h-9 pl-9 bg-background border-input rounded-md focus-visible:ring-primary/10 focus-visible:border-primary/40 text-sm font-medium transition-all duration-300"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-[10px] font-bold text-destructive/90 ml-0.5 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <Label htmlFor="password" title="password" className="text-foreground/70 font-bold text-[10px] uppercase tracking-wider">Kata Sandi</Label>
                <button type="button" className="text-[10px] font-black text-primary/70 hover:text-primary transition-colors tracking-tighter uppercase">Lupa?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-9 pl-9 bg-background border-input rounded-md focus-visible:ring-primary/10 focus-visible:border-primary/40 text-sm font-medium transition-all duration-300"
                  {...register("password")}
                />
              </div>
              {errors.password && <p className="text-[10px] font-bold text-destructive/90 ml-0.5 mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-9 w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs rounded-md shadow-sm transition-all active:scale-[0.98] group relative mt-2"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2 tracking-wide uppercase">
                  Masuk Sekarang
                  <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-12 flex flex-col items-center">
             <div className="h-px w-8 bg-border/40 mb-4" />
             <p className="text-muted-foreground text-[10px] font-bold tracking-[0.1em] uppercase text-center opacity-70">
              &copy; {new Date().getFullYear()} Shine Education Bali
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
