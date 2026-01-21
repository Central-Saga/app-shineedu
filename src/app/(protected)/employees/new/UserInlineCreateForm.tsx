"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/modules/identity/domain/entities";

const USER_STATUS = ["Aktif", "Non Aktif"] as const;

export const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  status: z.enum(USER_STATUS),
  role: z.string().min(1, "Role wajib dipilih"),
});

export type UserFormValues = z.infer<typeof userSchema>;

export interface UserInlineCreateFormRef {
  trigger: () => Promise<boolean>;
  getValues: () => UserFormValues;
  setError: (name: string, error: { type?: string; message: string }) => void;
  clearErrors: (name?: string | string[]) => void;
  reset: () => void;
}

interface UserInlineCreateFormProps {
  roles: Role[];
  onCancel: () => void;
}

export const UserInlineCreateForm = forwardRef<
  UserInlineCreateFormRef,
  UserInlineCreateFormProps
>(function UserInlineCreateForm({ roles, onCancel }, ref) {
  const { register, setValue, watch, trigger, getValues, setError, clearErrors, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", status: "Aktif", role: "" },
  });

  useImperativeHandle(ref, () => ({
    trigger,
    getValues,
    setError: setError as (name: string, error: { type?: string; message: string }) => void,
    clearErrors: clearErrors as (name?: string | string[]) => void,
    reset,
  }), [trigger, getValues, setError, clearErrors, reset]);

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input id="user-name" {...register("name")} placeholder="Nama lengkap" />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              {...register("email")}
              placeholder="email@contoh.com"
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              {...register("password")}
              placeholder="Min. 8 karakter"
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="user-status"
                checked={watch("status") === "Aktif"}
                onCheckedChange={(c) => setValue("status", c ? "Aktif" : "Non Aktif")}
              />
              <span className="text-sm">Status: {watch("status")}</span>
            </div>
          </div>
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
              <p className="text-destructive text-sm">{errors.role.message}</p>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Batal Buat User
        </Button>
      </CardContent>
    </Card>
  );
});
