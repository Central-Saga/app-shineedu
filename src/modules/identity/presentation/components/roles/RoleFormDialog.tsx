"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import type { Permission } from "../../../domain/entities";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
  permissionNames: z.array(z.string()),
});

type Form = z.infer<typeof schema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  onSubmit: (payload: { name: string; permissions?: string[] }) => Promise<void>;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  permissions,
  onSubmit,
}: RoleFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", permissionNames: [] },
  });

  const permNames = watch("permissionNames") as string[];

  function togglePermission(name: string) {
    const next = permNames.includes(name)
      ? permNames.filter((p) => p !== name)
      : [...permNames, name];
    setValue("permissionNames", next);
  }

  function onOpenChangeWithReset(open: boolean) {
    if (!open) reset({ name: "", permissionNames: [] });
    onOpenChange(open);
  }

  async function onFormSubmit(values: Form) {
    try {
      await onSubmit({
        name: values.name,
        permissions: values.permissionNames.length > 0 ? values.permissionNames : undefined,
      });
      onOpenChangeWithReset(false);
    } catch (e) {
      if (e instanceof ValidationError && e.validationErrors) {
        applyValidationErrors(
          setError as (a: string, b: { type?: string; message: string }) => void,
          e.validationErrors
        );
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeWithReset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" {...register("name")} placeholder="Contoh: Staff" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Permissions (opsional)</Label>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="flex flex-col gap-2">
                {permissions.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={permNames.includes(p.name)}
                      onCheckedChange={() => togglePermission(p.name)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeWithReset(false)}
            >
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
