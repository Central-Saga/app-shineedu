"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
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

const KATEGORI_OPTIONS = [
  { label: "Tetap", value: "tetap" },
  { label: "Kontrak", value: "kontrak" },
  { label: "Freelance", value: "freelance" },
];
const SUBTIPE_OPTIONS = [
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
];
const TIPE_GAJI_OPTIONS = [
  { label: "Bulanan", value: "bulanan" },
  { label: "Per Sesi", value: "per_sesi" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EmployeeFormProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

export function EmployeeForm({ register, setValue, watch, errors }: EmployeeFormProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="kode_karyawan">Kode Karyawan</Label>
        <Input id="kode_karyawan" {...register("kode_karyawan")} />
        {errors.kode_karyawan && (
          <p className="text-destructive text-sm">{(errors.kode_karyawan as { message?: string }).message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Kategori Karyawan</Label>
          <Select
            value={watch("kategori_karyawan")}
            onValueChange={(v) => setValue("kategori_karyawan", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KATEGORI_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kategori_karyawan && (
            <p className="text-destructive text-sm">{(errors.kategori_karyawan as { message?: string }).message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Subtipe Kontrak</Label>
          <Select
            value={watch("subtipe_kontrak") ?? "__none__"}
            onValueChange={(v) => setValue("subtipe_kontrak", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih (opsional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {SUBTIPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipe Gaji</Label>
          <Select
            value={watch("tipe_gaji") ?? "__none__"}
            onValueChange={(v) => setValue("tipe_gaji", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih (opsional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {TIPE_GAJI_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gaji_pokok">Gaji Pokok</Label>
          <Input
            id="gaji_pokok"
            type="number"
            step="any"
            {...register("gaji_pokok")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank_nama">Bank - Nama</Label>
          <Input id="bank_nama" {...register("bank_nama")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_no_rekening">Bank - No. Rekening</Label>
          <Input id="bank_no_rekening" {...register("bank_no_rekening")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nomor_hp">Nomor HP</Label>
          <Input id="nomor_hp" {...register("nomor_hp")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
          <Input id="tanggal_lahir" type="date" {...register("tanggal_lahir")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alamat">Alamat</Label>
        <Input id="alamat" {...register("alamat")} />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex items-center gap-2">
          <Switch
            id="status"
            checked={watch("status") === "aktif"}
            onCheckedChange={(c) => setValue("status", c ? "aktif" : "nonaktif")}
          />
          <span className="text-sm">Status: {watch("status")}</span>
        </div>
        {errors.status && (
          <p className="text-destructive text-sm">{(errors.status as { message?: string }).message}</p>
        )}
      </div>
    </>
  );
}
