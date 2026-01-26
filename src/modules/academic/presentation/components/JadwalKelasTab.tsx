"use client";

import { useState, useEffect, useCallback } from "react";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { JadwalKerjaTable } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaTable";
import { JadwalKerjaForm } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { Employee } from "@/modules/employees/domain/entities";
import { JadwalKerja, CreateJadwalKerjaPayload } from "@/modules/jadwal-kerja/domain/entities";

interface JadwalKelasTabProps {
  kelasId: number;
}

export function JadwalKelasTab({ kelasId }: JadwalKelasTabProps) {
  const [schedules, setSchedules] = useState<JadwalKerja[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSchedules, resEmployees] = await Promise.all([
        academicApi.getKelasSchedules(kelasId),
        getEmployeesUsecase({ per_page: 100, status: "aktif" }),
      ]);

      if (resSchedules.success && resSchedules.data) {
        setSchedules(resSchedules.data);
      }
      
      if (resEmployees && resEmployees.items) {
          setEmployees(resEmployees.items);
      }

    } catch (error) {
      console.error("Failed to fetch jadwal data", error);
      toast.error("Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (values: CreateJadwalKerjaPayload) => {
    setIsSubmitting(true);
    try {
        await academicApi.addKelasSchedule(kelasId, values);
        toast.success("Jadwal berhasil ditambahkan");
        setOpen(false);
        fetchData(); 
    } catch (error: any) {
        console.error("Failed create schedule", error);
        toast.error(error.message || "Gagal membuat jadwal");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Jadwal Kelas</h3>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Jadwal
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah Jadwal Kelas</DialogTitle>
                    </DialogHeader>
                    <JadwalKerjaForm 
                        employees={employees}
                        onCancel={() => setOpen(false)}
                        onSubmit={handleCreate}
                        isSubmitting={isSubmitting}
                    />
                </DialogContent>
            </Dialog>
        </div>

        <JadwalKerjaTable 
            items={schedules}
            loading={loading}
            canUpdate={false} 
            canDelete={false} 
            onView={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
        />
      </CardContent>
    </Card>
  );
}
