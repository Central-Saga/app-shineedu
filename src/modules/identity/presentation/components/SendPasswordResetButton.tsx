"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetLink } from "@/modules/identity/infrastructure/identity.repository";

interface SendPasswordResetButtonProps {
  userId: number;
  userName: string;
  userEmail?: string | null;
  variant?: "icon" | "button";
  disabled?: boolean;
}

export function SendPasswordResetButton({
  userId,
  userName,
  userEmail,
  variant = "icon",
  disabled = false,
}: SendPasswordResetButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!userEmail) {
      toast.error("User tidak memiliki email");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetLink(userId);
      toast.success(`Link reset password berhasil dikirim ke ${userEmail}`);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengirim link reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return null;
  }

  if (variant === "button") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <KeyRound className="mr-2 size-4" />
            Kirim Link Reset Password
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kirim Link Reset Password</DialogTitle>
            <DialogDescription>
              Link reset password akan dikirim ke email {userName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Nama:</span>{" "}
                <span className="font-medium">{userName}</span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{userEmail}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Link akan kedaluwarsa dalam 60 menit.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSend} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Kirim Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="text-slate-500 hover:text-violet-600 hover:bg-violet-50"
            >
              <KeyRound className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Kirim Link Reset Password</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim Link Reset Password</DialogTitle>
          <DialogDescription>
            Link reset password akan dikirim ke email {userName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Nama:</span>{" "}
              <span className="font-medium">{userName}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{userEmail}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Link akan kedaluwarsa dalam 60 menit.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Kirim Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
