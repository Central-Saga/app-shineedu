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
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "../../domain/entities";
import type { IdentityUser } from "@/modules/identity/domain/entities";

const STATUS_OPTIONS = ["aktif", "nonaktif"] as const;

const createSchema = z.object({
  kode_karyawan: z.string().min(1, "Kode karyawan wajib diisi"),
  user_id: z.number().min(1, "User wajib dipilih"),
  kategori_karyawan: z.string().min(1, "Kategori karyawan wajib diisi"),
  subtipe_kontrak: z.string().optional(),
  tipe_gaji: z.string().optional(),
  gaji_pokok: z.union([z.string(), z.number()]).optional(),
  bank_nama: z.string().optional(),
  bank_no_rekening: z.string().optional(),
  nomor_hp: z.string().optional(),
  alamat: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  status: z.enum(STATUS_OPTIONS),
});

const updateSchema = z.object({
  kode_karyawan: z.string().min(1, "Kode karyawan wajib diisi"),
  user_id: z.number().optional().nullable(),
  kategori_karyawan: z.string().optional(),
  subtipe_kontrak: z.string().optional(),
  tipe_gaji: z.string().optional(),
  gaji_pokok: z.union([z.string(), z.number()]).optional(),
  bank_nama: z.string().optional(),
  bank_no_rekening: z.string().optional(),
  nomor_hp: z.string().optional(),
  alamat: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  status: z.enum(STATUS_OPTIONS).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

function toPayloadCreate(v: CreateForm): CreateEmployeePayload {
  const gaji = v.gaji_pokok;
  const gajiNum =
    gaji === "" || gaji === undefined || gaji === null
      ? null
      : typeof gaji === "string"
        ? (Number(gaji) || null)
        : gaji;
  return {
    kode_karyawan: v.kode_karyawan,
    user_id: v.user_id,
    kategori_karyawan: v.kategori_karyawan,
    subtipe_kontrak: v.subtipe_kontrak || null,
    tipe_gaji: v.tipe_gaji || null,
    gaji_pokok: gajiNum,
    bank_nama: v.bank_nama || null,
    bank_no_rekening: v.bank_no_rekening || null,
    nomor_hp: v.nomor_hp || null,
    alamat: v.alamat || null,
    tanggal_lahir: v.tanggal_lahir || null,
    status: v.status,
  };
}

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: IdentityUser[];
  employee: Employee | null;
  onSubmitCreate: (p: CreateEmployeePayload) => Promise<void>;
  onSubmitUpdate: (id: number, p: UpdateEmployeePayload) => Promise<void>;
}

const defaultCreate: CreateForm = {
  kode_karyawan: "",
  user_id: 0,
  kategori_karyawan: "",
  subtipe_kontrak: "",
  tipe_gaji: "",
  gaji_pokok: "",
  bank_nama: "",
  bank_no_rekening: "",
  nomor_hp: "",
  alamat: "",
  tanggal_lahir: "",
  status: "aktif",
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  users,
  employee,
  onSubmitCreate,
  onSubmitUpdate,
}: EmployeeFormDialogProps) {
  const isCreate = !employee;

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: defaultCreate,
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { ...defaultCreate, status: "aktif" },
  });

  function mapToUpdateForm(e: Employee): UpdateForm {
    const gaji = e.gaji_pokok;
    return {
      kode_karyawan: e.kode_karyawan,
      user_id: e.user?.id ?? null,
      kategori_karyawan: e.kategori_karyawan ?? "",
      subtipe_kontrak: e.subtipe_kontrak ?? "",
      tipe_gaji: e.tipe_gaji ?? "",
      gaji_pokok: gaji != null ? String(gaji) : "",
      bank_nama: e.bank?.nama ?? "",
      bank_no_rekening: e.bank?.rekening ?? "",
      nomor_hp: e.kontak?.nomor_hp ?? "",
      alamat: e.kontak?.alamat ?? "",
      tanggal_lahir: e.tanggal_lahir ?? "",
      status: (e.status === "aktif" || e.status === "nonaktif" ? e.status : "aktif") as "aktif" | "nonaktif",
    };
  }

  const reset = () => {
    if (isCreate) {
      createForm.reset(defaultCreate);
    } else if (employee) {
      updateForm.reset(mapToUpdateForm(employee));
    }
  };

  useEffect(() => {
    if (open && employee) {
      updateForm.reset(mapToUpdateForm(employee));
    }
  }, [open, employee?.id]);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  if (isCreate) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Karyawan</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(async (v) => {
              try {
                await onSubmitCreate(toPayloadCreate(v));
                handleOpenChange(false);
              } catch (e) {
                if (e instanceof ValidationError && e.validationErrors) {
                  applyValidationErrors(
                    createForm.setError as (a: string, b: { type?: string; message: string }) => void,
                    e.validationErrors
                  );
                }
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Kode Karyawan</Label>
              <Input {...createForm.register("kode_karyawan")} />
              {createForm.formState.errors.kode_karyawan && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.kode_karyawan.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={createForm.watch("user_id") ? String(createForm.watch("user_id")) : ""}
                onValueChange={(v) => createForm.setValue("user_id", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.user_id && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.user_id.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Kategori Karyawan</Label>
              <Input {...createForm.register("kategori_karyawan")} />
              {createForm.formState.errors.kategori_karyawan && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.kategori_karyawan.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subtipe Kontrak</Label>
              <Input {...createForm.register("subtipe_kontrak")} />
            </div>
            <div className="space-y-2">
              <Label>Tipe Gaji</Label>
              <Input {...createForm.register("tipe_gaji")} />
            </div>
            <div className="space-y-2">
              <Label>Gaji Pokok</Label>
              <Input
                type="number"
                step="any"
                {...createForm.register("gaji_pokok")}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank - Nama</Label>
              <Input {...createForm.register("bank_nama")} />
            </div>
            <div className="space-y-2">
              <Label>Bank - No. Rekening</Label>
              <Input {...createForm.register("bank_no_rekening")} />
            </div>
            <div className="space-y-2">
              <Label>Nomor HP</Label>
              <Input {...createForm.register("nomor_hp")} />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input {...createForm.register("alamat")} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input type="date" {...createForm.register("tanggal_lahir")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={createForm.watch("status")}
                onValueChange={(v) =>
                  createForm.setValue("status", v as CreateForm["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
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

  const toUpdatePayload = (v: UpdateForm): UpdateEmployeePayload => {
    const gaji = v.gaji_pokok;
    const gajiNum =
      gaji === "" || gaji === undefined || gaji === null
        ? null
        : typeof gaji === "string"
          ? (Number(gaji) || null)
          : gaji;
    return {
      kode_karyawan: v.kode_karyawan,
      user_id: v.user_id ?? undefined,
      kategori_karyawan: v.kategori_karyawan || null,
      subtipe_kontrak: v.subtipe_kontrak || null,
      tipe_gaji: v.tipe_gaji || null,
      gaji_pokok: gajiNum,
      bank_nama: v.bank_nama || null,
      bank_no_rekening: v.bank_no_rekening || null,
      nomor_hp: v.nomor_hp || null,
      alamat: v.alamat || null,
      tanggal_lahir: v.tanggal_lahir || null,
      status: v.status ?? null,
    };
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Karyawan</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={updateForm.handleSubmit(async (v) => {
            if (!employee) return;
            try {
              await onSubmitUpdate(employee.id, toUpdatePayload(v));
              handleOpenChange(false);
            } catch (e) {
              if (e instanceof ValidationError && e.validationErrors) {
                applyValidationErrors(
                  updateForm.setError as (a: string, b: { type?: string; message: string }) => void,
                  e.validationErrors
                );
              }
            }
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Kode Karyawan</Label>
            <Input {...updateForm.register("kode_karyawan")} />
            {updateForm.formState.errors.kode_karyawan && (
              <p className="text-destructive text-sm">
                {updateForm.formState.errors.kode_karyawan.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>User</Label>
            <Select
              value={
                updateForm.watch("user_id") != null
                  ? String(updateForm.watch("user_id"))
                  : ""
              }
              onValueChange={(v) =>
                updateForm.setValue("user_id", v ? Number(v) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori Karyawan</Label>
            <Input {...updateForm.register("kategori_karyawan")} />
          </div>
          <div className="space-y-2">
            <Label>Subtipe Kontrak</Label>
            <Input {...updateForm.register("subtipe_kontrak")} />
          </div>
          <div className="space-y-2">
            <Label>Tipe Gaji</Label>
            <Input {...updateForm.register("tipe_gaji")} />
          </div>
          <div className="space-y-2">
            <Label>Gaji Pokok</Label>
            <Input
              type="number"
              step="any"
              {...updateForm.register("gaji_pokok")}
            />
          </div>
          <div className="space-y-2">
            <Label>Bank - Nama</Label>
            <Input {...updateForm.register("bank_nama")} />
          </div>
          <div className="space-y-2">
            <Label>Bank - No. Rekening</Label>
            <Input {...updateForm.register("bank_no_rekening")} />
          </div>
          <div className="space-y-2">
            <Label>Nomor HP</Label>
            <Input {...updateForm.register("nomor_hp")} />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input {...updateForm.register("alamat")} />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Lahir</Label>
            <Input type="date" {...updateForm.register("tanggal_lahir")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={updateForm.watch("status") ?? "aktif"}
              onValueChange={(v) =>
                updateForm.setValue(
                  "status",
                  (v as "aktif" | "nonaktif") ?? undefined
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
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
