"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateJobApplication } from "../../infrastructure/job-application.repository";
import type {
  JobApplication,
  JobApplicationStatus,
} from "../../domain/entities";

const STATUS_OPTIONS: { value: JobApplicationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

interface JobApplicationEditFormProps {
  initialData: JobApplication;
}

export function JobApplicationEditForm({ initialData }: JobApplicationEditFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<JobApplicationStatus>(initialData.status);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateJobApplication(initialData.id, { status });
      toast.success("Status lamaran diperbarui");
      router.push(`/job-applications/${initialData.id}`);
    } catch (e) {
      toast.error("Gagal memperbarui lamaran");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm font-bold">Ubah Status Lamaran</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as JobApplicationStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/job-applications/${initialData.id}`)}
              >
                Batal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
