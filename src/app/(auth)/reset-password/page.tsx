"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ChevronRight, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { validateResetToken, resetPassword } from "@/modules/identity/infrastructure/identity.repository";

// Password must have: min 8 chars, uppercase, lowercase, number, special char
const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka")
    .regex(/[@$!%*#?&]/, "Password harus mengandung karakter khusus (@$!%*#?&)"),
  passwordConfirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Konfirmasi password tidak cocok",
  path: ["passwordConfirmation"],
});

type Form = z.infer<typeof passwordSchema>;

type PageState = "loading" | "valid" | "invalid" | "expired" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [mounted, setMounted] = useState(false);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  const password = watch("password");

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@$!%*#?&]/.test(password);
  const allValid = hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecial;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function validate() {
      if (!token || !email) {
        setPageState("invalid");
        return;
      }

      try {
        await validateResetToken(token, email);
        setPageState("valid");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("kedaluwarsa")) {
          setPageState("expired");
        } else {
          setPageState("invalid");
        }
      }
    }

    validate();
  }, [mounted, token, email]);

  async function onSubmit(values: Form) {
    if (!token || !email) return;

    setSubmitting(true);
    try {
      await resetPassword(token, email, values.password, values.passwordConfirmation);
      setPageState("success");
      toast.success("Password berhasil diubah!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah password"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  // Error states
  if (pageState === "invalid" || pageState === "expired") {
    return (
      <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className={`size-16 rounded-full flex items-center justify-center ${
                pageState === "expired" ? "bg-amber-100" : "bg-rose-100"
              }`}>
                {pageState === "expired" ? (
                  <AlertCircle className="size-8 text-amber-600" />
                ) : (
                  <XCircle className="size-8 text-rose-600" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter mb-2">
              {pageState === "expired" ? "Link Kedaluwarsa" : "Link Tidak Valid"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {pageState === "expired"
                ? "Link reset password sudah kedaluwarsa. Silakan minta link baru dari administrator."
                : "Link reset password tidak valid. Silakan minta link baru dari administrator."}
            </p>
            <Button onClick={() => router.push("/login")}>
              Kembali ke Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter mb-2">
              Password Berhasil Diubah!
            </h1>
            <p className="text-muted-foreground mb-6">
              Password Anda telah berhasil diperbarui. Silakan login dengan password baru.
            </p>
            <Button onClick={() => router.push("/login")}>
              <ChevronRight className="mr-2 size-4" />
              Lanjut ke Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memvalidasi link...</p>
        </div>
      </div>
    );
  }

  // Valid state - show form
  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Left Panel: Branding */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-center p-16 overflow-hidden bg-muted/20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,var(--background)_100%)]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center lg:items-start space-y-12 max-w-xl mx-auto">
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

          <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
            <Image 
              src="/login.svg" 
              alt="Reset Password Illustration" 
              fill
              className="object-contain relative z-10"
              priority
            />
          </div>
          
          <div className="space-y-4 text-left w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Secure Reset</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">
              Reset <br />
              <span className="text-primary tracking-tighter italic">Password</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm opacity-80">
              Buat password baru untuk akun Anda di Shine Education Bali.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-background relative z-10">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-96 bg-primary/5 blur-[100px] pointer-events-none hidden lg:block" />
        
        <div className="w-full max-w-[380px] relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-black tracking-tighter text-foreground mb-1.5">Buat Password Baru</h2>
            <p className="text-muted-foreground text-xs font-medium">Masukkan password baru untuk akun Anda</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground/70 font-bold text-[10px] uppercase tracking-wider ml-0.5">
                Password Baru
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  className="h-10 pl-9 pr-10 bg-background border-input rounded-md focus-visible:ring-primary/10 focus-visible:border-primary/40 text-sm font-medium transition-all duration-300"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] font-bold text-destructive/90 ml-0.5 mt-1">{errors.password.message}</p>}
            </div>

            {/* Password Strength Indicators */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kriteria Password:</p>
              <div className="grid grid-cols-2 gap-2">
                <PasswordCriteria met={hasMinLength} text="Min. 8 karakter" />
                <PasswordCriteria met={hasLowercase} text="Huruf kecil (a-z)" />
                <PasswordCriteria met={hasUppercase} text="Huruf besar (A-Z)" />
                <PasswordCriteria met={hasNumber} text="Angka (0-9)" />
                <PasswordCriteria met={hasSpecial} text="Karakter khusus (@$!%*#?&)" />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirmation" className="text-foreground/70 font-bold text-[10px] uppercase tracking-wider ml-0.5">
                Konfirmasi Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  id="passwordConfirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  className="h-10 pl-9 pr-10 bg-background border-input rounded-md focus-visible:ring-primary/10 focus-visible:border-primary/40 text-sm font-medium transition-all duration-300"
                  {...register("passwordConfirmation")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.passwordConfirmation && <p className="text-[10px] font-bold text-destructive/90 ml-0.5 mt-1">{errors.passwordConfirmation.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={submitting || !allValid}
              className="h-10 w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs rounded-md shadow-sm transition-all active:scale-[0.98] group relative mt-4"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2 tracking-wide uppercase">
                  Perbarui Password
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
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

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-medium ${met ? "text-emerald-600" : "text-muted-foreground"}`}>
      {met ? (
        <CheckCircle2 className="size-3 shrink-0" />
      ) : (
        <div className="size-3 shrink-0 rounded-full border border-current" />
      )}
      <span>{text}</span>
    </div>
  );
}
