"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createJobVacancy,
  updateJobVacancy,
} from "../../infrastructure/job-vacancy.repository";
import type { JobVacancy } from "../../domain/entities";

const EMPLOYMENT_TYPES = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
];

function ListEditor({
  items,
  onChange,
  placeholder,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  label: string;
}) {
  const add = () => onChange([...items, ""]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const set = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="shrink-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface JobVacancyFormProps {
  initialData?: JobVacancy | null;
  isEdit?: boolean;
}

export function JobVacancyForm({ initialData, isEdit = false }: JobVacancyFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [description, setDescription] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? "");
      setLocation(initialData.location ?? "");
      setEmploymentType(initialData.employment_type ?? "");
      setDescription(initialData.description ?? "");
      setPostedAt(initialData.posted_at ? initialData.posted_at.slice(0, 10) : "");
      setEndAt(initialData.end_at ? initialData.end_at.slice(0, 10) : "");
      setRequirements(Array.isArray(initialData.requirements) ? initialData.requirements : []);
      setResponsibilities(Array.isArray(initialData.responsibilities) ? initialData.responsibilities : []);
      setBenefits(Array.isArray(initialData.benefits) ? initialData.benefits : []);
      setIsActive(initialData.is_active ?? true);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul lowongan wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        location: location.trim() || undefined,
        employment_type: employmentType || undefined,
        description: description.trim() || undefined,
        posted_at: postedAt || undefined,
        end_at: endAt || undefined,
        requirements: requirements.filter(Boolean),
        responsibilities: responsibilities.filter(Boolean),
        benefits: benefits.filter(Boolean),
        is_active: isActive,
      };
      if (isEdit && initialData?.id) {
        await updateJobVacancy(initialData.id, payload);
        toast.success("Lowongan berhasil diperbarui");
      } else {
        await createJobVacancy(payload);
        toast.success("Lowongan berhasil dibuat");
      }
      router.push("/job-vacancies");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan lowongan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Posisi *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Guru Bahasa Inggris"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Denpasar, Bali"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Pekerjaan</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="is_active">Lowongan aktif (ditampilkan di landing)</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Pekerjaan</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan posisi dan tanggung jawab utama..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posted_at">Tanggal Dibuka</Label>
                <Input
                  id="posted_at"
                  type="date"
                  value={postedAt}
                  onChange={(e) => setPostedAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">Tanggal Ditutup</Label>
                <Input
                  id="end_at"
                  type="date"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Kualifikasi</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ListEditor
              items={requirements}
              onChange={setRequirements}
              label="Persyaratan / Kualifikasi"
              placeholder="Contoh: Sarjana Pendidikan Bahasa Inggris"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Tanggung Jawab</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ListEditor
              items={responsibilities}
              onChange={setResponsibilities}
              label="Tanggung Jawab"
              placeholder="Contoh: Menyiapkan materi pembelajaran"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Benefit</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ListEditor
              items={benefits}
              onChange={setBenefits}
              label="Benefit"
              placeholder="Contoh: Gaji kompetitif"
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Lowongan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/job-vacancies")}
          >
            Batal
          </Button>
        </div>
      </div>
    </form>
  );
}
