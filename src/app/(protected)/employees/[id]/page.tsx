"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployeeUsecase } from "@/modules/employees/application/usecases/getEmployee.usecase";
import { getUserUsecase } from "@/modules/identity/application/usecases/users.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { Employee } from "@/modules/employees/domain/entities";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { 
  User, 
  Briefcase, 
  CreditCard, 
  Phone, 
  MapPin, 
  Calendar, 
  Pencil, 
  ArrowLeft,
  Mail,
  ShieldCheck,
  Building2
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0 border-slate-50/80">
      <div className="mt-0.5 p-1.5 bg-rose-50 rounded-md text-rose-500 shrink-0">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <div className="truncate">
          {badge && value ? (
            <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none h-5 px-2 text-[10px] capitalize">
              {value.replace("_", " ")}
            </Badge>
          ) : (
            <p className="text-slate-700 font-medium text-sm leading-tight">{value || "-"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { allowed } = usePermissionGuard("employees.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [userAccount, setUserAccount] = useState<IdentityUser | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("employees.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Karyawan", href: "/employees" },
      { label: "Detail Karyawan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const emp = await getEmployeeUsecase(id);
        setEmployee(emp);
        
        if (emp.user?.id) {
          const user = await getUserUsecase(emp.user.id);
          setUserAccount(user);
        }
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Karyawan tidak ditemukan");
          router.replace("/employees");
        } else {
          toast.error("Gagal memuat data karyawan");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowed, id, router]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Karyawan" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const formatCurrency = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "") return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return String(s);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-600">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
            {userAccount?.name || employee.user?.name || "Detail Karyawan"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
            <span className="font-mono text-xs font-medium">{employee.kode_karyawan}</span> 
            <span className="text-slate-200">|</span>
            <Badge variant="outline" className={employee.status === "aktif" ? "border-emerald-200 bg-emerald-50/30 text-emerald-600 h-4 px-1.5 text-[10px]" : "border-rose-100 bg-rose-50/30 text-rose-600 h-4 px-1.5 text-[10px]"}>
              {employee.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-full px-5 h-9 bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200">
              <Link href={`/employees/${employee.id}/edit`}>
                <Pencil className="mr-2 size-3.5" />
                Edit Data
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-28 bg-linear-to-br from-rose-700 via-rose-600 to-amber-500" />
            <div className="px-6 pb-8 -mt-12 text-center relative z-10">
              <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                <div className="size-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <User className="size-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {userAccount?.name || employee.user?.name || "-"}
              </h2>
              <p className="text-sm text-slate-400 font-medium mb-6">
                {userAccount?.email || employee.user?.email || "-"}
              </p>
              
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold">
                  {userAccount?.roles?.[0]?.name || "Karyawan"}
                </Badge>
                {employee.kategori_karyawan && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold capitalize">
                    {employee.kategori_karyawan}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-rose-50 rounded-md">
                  <ShieldCheck className="size-3.5 text-rose-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Informasi Akun</h3>
              </div>
              <div className="space-y-0.5 px-1">
                <DetailItem icon={Mail} label="Alamat Email" value={userAccount?.email} />
                <DetailItem icon={ShieldCheck} label="Role Sistem" value={userAccount?.roles?.[0]?.name} />
                <DetailItem icon={Calendar} label="Terdaftar Sejak" value={formatDate(userAccount?.created_at)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-rose-50 rounded-md">
                  <Building2 className="size-3.5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Detail Pekerjaan</h3>
                  <p className="text-[10px] text-slate-400 mt-px">Data kontrak dan identitas internal</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 px-1">
                <DetailItem icon={Briefcase} label="ID Karyawan" value={employee.kode_karyawan} />
                <DetailItem icon={Briefcase} label="Kategori Kerja" value={employee.kategori_karyawan} badge />
                <DetailItem icon={Briefcase} label="Subtipe Kontrak" value={employee.subtipe_kontrak} badge />
                <DetailItem icon={Calendar} label="Tanggal Lahir" value={formatDate(employee.tanggal_lahir)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-amber-50 rounded-md">
                  <CreditCard className="size-3.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Payroll & Perbankan</h3>
                  <p className="text-[10px] text-slate-400 mt-px">Sistem penggajian dan rekening</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 px-1">
                <DetailItem icon={CreditCard} label="Metode Gaji" value={employee.tipe_gaji} badge />
                <DetailItem icon={CreditCard} label="Estimasi Gaji Pokok" value={formatCurrency(employee.gaji_pokok)} />
                <DetailItem icon={Building2} label="Nama Bank" value={employee.bank?.nama} />
                <DetailItem icon={CreditCard} label="Nomor Rekening" value={employee.bank?.rekening} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-rose-50 rounded-md">
                  <Phone className="size-3.5 text-rose-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Kontak Personil</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 px-1">
                <DetailItem icon={Phone} label="Nomor Telepon/HP" value={employee.kontak?.nomor_hp} />
                <DetailItem icon={MapPin} label="Alamat Domisili" value={employee.kontak?.alamat} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
