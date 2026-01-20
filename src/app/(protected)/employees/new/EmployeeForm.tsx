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
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export interface EmployeeFormProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  onRegenerateCode?: () => void;
}

export function EmployeeForm({ register, setValue, watch, errors, onRegenerateCode }: EmployeeFormProps) {
  const kategori = watch("kategori_karyawan");

  return (
    <div className="space-y-6">
      {/* Panel logic moved to parent, here we provide field groupings */}
      
      {/* Field: Kode Karyawan */}
      <div className="space-y-2">
        <Label htmlFor="kode_karyawan">Kode Karyawan</Label>
        <div className="flex gap-2">
          <Input 
            id="kode_karyawan" 
            {...register("kode_karyawan")} 
            readOnly 
            className="bg-slate-50 font-mono tracking-wider" 
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={onRegenerateCode}
            title="Regenerate Code"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Otomatis digenerate berdasarkan tanggal lahir</p>
        {errors.kode_karyawan && (
          <p className="text-destructive text-sm">{(errors.kode_karyawan as { message?: string }).message}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Kategori Karyawan</Label>
          <Select
            value={watch("kategori_karyawan")}
            onValueChange={(v) => {
              setValue("kategori_karyawan", v);
              if (v !== "kontrak") setValue("subtipe_kontrak", null);
            }}
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
          <p className="text-[11px] text-muted-foreground">Tentukan jenis hubungan kerja</p>
          {errors.kategori_karyawan && (
            <p className="text-destructive text-sm">{(errors.kategori_karyawan as { message?: string }).message}</p>
          )}
        </div>

        {kategori === "kontrak" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
            <Label>Subtipe Kontrak</Label>
            <Select
              value={watch("subtipe_kontrak") ?? "__none__"}
              onValueChange={(v) => setValue("subtipe_kontrak", v === "__none__" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih subtipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {SUBTIPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Hanya untuk karyawan Kontrak</p>
            {errors.subtipe_kontrak && (
              <p className="text-destructive text-sm">{(errors.subtipe_kontrak as { message?: string }).message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipe Gaji</Label>
          <Select
            value={watch("tipe_gaji") ?? "__none__"}
            onValueChange={(v) => setValue("tipe_gaji", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe gaji" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {TIPE_GAJI_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">Bulanan atau per sesi</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gaji_pokok">Gaji Pokok</Label>
          <Input
            id="gaji_pokok"
            type="number"
            step="any"
            {...register("gaji_pokok")}
            placeholder="0"
          />
          <p className="text-[11px] text-muted-foreground">Nominal gaji pokok (IDR)</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank_nama">Bank - Nama</Label>
          <Input id="bank_nama" {...register("bank_nama")} placeholder="Contoh: BCA / Mandiri" />
          <p className="text-[11px] text-muted-foreground">Nama bank untuk payroll</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_no_rekening">Bank - No. Rekening</Label>
          <Input id="bank_no_rekening" {...register("bank_no_rekening")} placeholder="0000000000" />
          <p className="text-[11px] text-muted-foreground">Nomor rekening transfer</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nomor_hp">Nomor HP</Label>
          <Input id="nomor_hp" {...register("nomor_hp")} placeholder="08xxxxxxxxxx" />
          <p className="text-[11px] text-muted-foreground">Nomor WhatsApp aktif</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
          <Input id="tanggal_lahir" type="date" {...register("tanggal_lahir")} />
          <p className="text-[11px] text-muted-foreground">Format: DD/MM/YYYY</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alamat">Alamat</Label>
        <Input id="alamat" {...register("alamat")} placeholder="Alamat lengkap domisili" />
        <p className="text-[11px] text-muted-foreground">Sesuai KTP atau domisili saat ini</p>
      </div>

      {/* Hidden Status Input since it's always "aktif" */}
      <input type="hidden" {...register("status")} value="aktif" />
    </div>
  );
}
