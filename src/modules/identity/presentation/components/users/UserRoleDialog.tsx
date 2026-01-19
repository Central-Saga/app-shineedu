"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdentityUser } from "../../../domain/entities";
import type { Role } from "../../../domain/entities";

const schema = z.object({
  role: z.string().min(1, "Role wajib dipilih"),
});

type Form = z.infer<typeof schema>;

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: IdentityUser | null;
  roles: Role[];
  onSubmit: (userId: number, roleName: string) => Promise<void>;
}

export function UserRoleDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
}: UserRoleDialogProps) {
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "" },
  });

  const currentRole = user?.roles?.[0]?.name ?? "";

  useEffect(() => {
    if (open && user) setValue("role", currentRole);
  }, [open, user?.id, currentRole, setValue]);

  function handleOpenChange(open: boolean) {
    if (!open) reset({ role: "" });
    else if (user) setValue("role", currentRole);
    onOpenChange(open);
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {user.name} ({user.email})
          </p>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (v) => {
            await onSubmit(user.id, v.role);
            handleOpenChange(false);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={watch("role")}
              onValueChange={(v) => setValue("role", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
