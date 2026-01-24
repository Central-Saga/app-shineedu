"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jenjangSchema, type JenjangFormValues } from "../schemas";
import { createJenjang, updateJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang } from "@/modules/catalog/domain/entities";
import { useTransition } from "react";

interface JenjangFormProps {
  initialData?: Jenjang;
  mode: "create" | "edit";
}

export function JenjangForm({ initialData, mode }: JenjangFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<JenjangFormValues>({
    resolver: zodResolver(jenjangSchema),
    defaultValues: {
      kode: initialData?.kode || "",
      nama: initialData?.nama || "",
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
    },
  });

  const onSubmit = (values: JenjangFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit" && initialData) {
          await updateJenjang(initialData.id, values);
          toast.success("Jenjang berhasil diperbarui");
        } else {
          await createJenjang(values);
          toast.success("Jenjang berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/jenjang");
        router.refresh();
      } catch (error: any) {
        if (error?.details) {
            Object.keys(error.details).forEach((key) => {
                form.setError(key as any, { message: error.details[key][0] });
            });
        }
      }
    });
  };

  return (
    <Card className="border-none shadow-premium ring-1 ring-slate-100 rounded-2xl overflow-hidden py-0">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800">
          {mode === "create" ? "Tambah Jenjang Pendidikan" : `Edit Jenjang: ${initialData?.kode}`}
        </CardTitle>
        <CardDescription>
          Informasi dasar untuk klasifikasi tingkatan siswa (Contoh: SD, SMP, SMA).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Kode Jenjang</FormLabel>
                    <FormControl>
                      <Input placeholder="SD" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Singkatan unik jenjang.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Sekolah Dasar" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Nama resmi tingkatan pendidikan.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Status Operasional</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isPending}
                    className="text-slate-500"
                >
                    Batal
                </Button>
                <Button type="submit" disabled={isPending} className="bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200 rounded-full px-8">
                    {isPending ? "Menyimpan..." : mode === "create" ? "Simpan Jenjang" : "Perbarui Jenjang"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
