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
import { Input } from "@/components/ui/input";
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

const STATUS = ["Aktif", "Non Aktif"] as const;

const createSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  status: z.enum(STATUS),
  role: z.string().min(1, "Role wajib dipilih"),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().optional(),
  status: z.enum(STATUS),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  user: IdentityUser | null;
  onSubmitCreate: (p: {
    name: string;
    email: string;
    password: string;
    status: string;
    role: string;
  }) => Promise<void>;
  onSubmitUpdate: (id: number, p: {
    name: string;
    email: string;
    status: string;
    password?: string;
  }) => Promise<void>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  roles,
  user,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormDialogProps) {
  const isCreate = !user;

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      status: "Aktif",
      role: "",
    },
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      status: "Aktif",
    },
  });

  const reset = () => {
    if (isCreate) {
      createForm.reset({ name: "", email: "", password: "", status: "Aktif", role: "" });
    } else if (user) {
      updateForm.reset({
        name: user.name,
        email: user.email,
        password: "",
        status: (user.status as UpdateForm["status"]) ?? "Aktif",
      });
    }
  };

  useEffect(() => {
    if (open && user) {
      updateForm.reset({
        name: user.name,
        email: user.email,
        password: "",
        status: (user.status as UpdateForm["status"]) ?? "Aktif",
      });
    }
  }, [open, user?.id]);

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  if (isCreate) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(async (v) => {
              await onSubmitCreate({
                name: v.name,
                email: v.email,
                password: v.password,
                status: v.status,
                role: v.role,
              });
              handleOpenChange(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...createForm.register("email")} />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...createForm.register("password")} />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={createForm.watch("status")}
                onValueChange={(v) => createForm.setValue("status", v as CreateForm["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.watch("role")}
                onValueChange={(v) => createForm.setValue("role", v)}
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
              {createForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.role.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={updateForm.handleSubmit(async (v) => {
            await onSubmitUpdate(user.id, {
              name: v.name,
              email: v.email,
              status: v.status,
              password: v.password || undefined,
            });
            handleOpenChange(false);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input {...updateForm.register("name")} />
            {updateForm.formState.errors.name && (
              <p className="text-sm text-destructive">
                {updateForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...updateForm.register("email")} />
            {updateForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {updateForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Password (kosongkan jika tidak diubah)</Label>
            <Input type="password" {...updateForm.register("password")} />
            {updateForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {updateForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={updateForm.watch("status")}
              onValueChange={(v) => updateForm.setValue("status", v as UpdateForm["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateForm.formState.isSubmitting}>
              {updateForm.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
