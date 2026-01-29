"use client";

import { useEffect, useState, useTransition } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { 
    lookupPrice, 
    listJenjang,
    listProgram,
    listPaket 
} from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang, Program, Paket } from "@/modules/catalog/domain/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LookupPage() {
  const { allowed } = usePermissionGuard("catalog.pricing.view");
  const { setItems } = useBreadcrumbStore();
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);

  const [form, setForm] = useState({
      program_id: "",
      jenjang_id: "",
      paket_id: "",
      jumlah_siswa: "1",
      tanggal: new Date().toISOString().split("T")[0]
  });

  const [result, setResult] = useState<{ harga: number, rule: any } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Cek Harga (Test)" },
    ]);

    if (allowed) {
        Promise.all([
            listProgram({ per_page: 999, status: "Aktif" }),
            listJenjang({ per_page: 999, status: "Aktif" }),
            listPaket({ per_page: 999, status: "Aktif" })
        ]).then(([p, j, pk]) => {
            setPrograms(p.items);
            setJenjangs(j.items);
            setPakets(pk.items);
        });
    }
  }, [setItems, allowed]);

  const handleCheck = () => {
      if (!form.program_id || !form.jenjang_id || !form.paket_id || !form.jumlah_siswa) {
          toast.error("Mohon lengkapi form");
          return;
      }

      startTransition(async () => {
         try {
             const res = await lookupPrice({
                 program_id: form.program_id,
                 jenjang_id: form.jenjang_id,
                 paket_id: form.paket_id,
                 jumlah_siswa: form.jumlah_siswa,
                 tanggal: form.tanggal
             });
             setResult(res);
         } catch (e: any) {
             toast.error("Harga tidak ditemukan atau terjadi kesalahan");
             setResult(null);
         }
      });
  };

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lookup Harga"
        description="Simulasi perhitungan harga berdasarkan aturan yang berlaku"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Parameter Simulasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Program</Label>
                    <Select onValueChange={(v) => setForm({...form, program_id: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Program" />
                        </SelectTrigger>
                        <SelectContent>
                            {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Jenjang</Label>
                    <Select onValueChange={(v) => setForm({...form, jenjang_id: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Jenjang" />
                        </SelectTrigger>
                        <SelectContent>
                            {jenjangs.map(j => <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Paket</Label>
                    <Select onValueChange={(v) => setForm({...form, paket_id: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Paket" />
                        </SelectTrigger>
                        <SelectContent>
                            {pakets.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Jumlah Siswa</Label>
                        <Input 
                            type="number" 
                            min={1} 
                            value={form.jumlah_siswa} 
                            onChange={(e) => setForm({...form, jumlah_siswa: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input 
                            type="date" 
                            value={form.tanggal} 
                            onChange={(e) => setForm({...form, tanggal: e.target.value})}
                        />
                    </div>
                </div>

                <Button className="w-full" onClick={handleCheck} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin"/>}
                    Cek Harga
                </Button>
            </CardContent>
        </Card>

        {result && (
            <Card className="bg-slate-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-700">Hasil Pencarian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-muted-foreground">Harga Satuan</Label>
                        <div className="text-3xl font-bold text-slate-900">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(result.harga)}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-blue-100">
                        <Label className="text-muted-foreground mb-2 block">Detail Aturan (Rule ID: {result.rule.id})</Label>
                        <ul className="text-sm space-y-1 text-slate-700">
                            <li>• Range Siswa: {result.rule.min_siswa} - {result.rule.max_siswa}</li>
                            <li>• Berlaku: {result.rule.effective_from ? result.rule.effective_from : "∞"} s/d {result.rule.effective_to ? result.rule.effective_to : "∞"}</li>
                            <li>• Status: {result.rule.status}</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
