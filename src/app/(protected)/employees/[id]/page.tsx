"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployeeUsecase } from "@/modules/employees/application/usecases/getEmployee.usecase";
import { getUserUsecase } from "@/modules/identity/application/usecases/users.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Employee } from "@/modules/employees/domain/entities";
import { IdentityUser } from "@/modules/identity/domain/entities";
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
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="truncate">
          {badge && value ? (
            <Badge variant="outline" className="font-semibold capitalize">
              {value.replace("_", " ")}
            </Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
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
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 rounded-lg" />
          </div>
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
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Karyawan</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {employee.kode_karyawan}
              </Badge>
              <Badge variant={employee.status === "aktif" ? "outline" : "secondary"} className={employee.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {employee.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/employees/${employee.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Data
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border">
                   <User className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold">{userAccount?.name || employee.user?.name || "-"}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                   {userAccount?.email || employee.user?.email || "-"}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                   <Badge variant="outline">
                     {userAccount?.roles?.[0]?.name || "Karyawan"}
                   </Badge>
                   {employee.kategori_karyawan && (
                     <Badge variant="outline" className="capitalize">
                       {employee.kategori_karyawan}
                     </Badge>
                   )}
                 </div>
              </div>

              <div className="space-y-1">
                 <DetailItem icon={Mail} label="Alamat Email" value={userAccount?.email} />
                 <DetailItem icon={ShieldCheck} label="Role Sistem" value={userAccount?.roles?.[0]?.name} />
                 <DetailItem icon={Calendar} label="Terdaftar Sejak" value={formatDate(userAccount?.created_at)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Phone className="size-4" /> Kontak Personil
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="space-y-1">
                 <DetailItem icon={Phone} label="Nomor Telepon/HP" value={employee.kontak?.nomor_hp} />
                 <DetailItem icon={MapPin} label="Alamat Domisili" value={employee.kontak?.alamat} />
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="size-4" /> Detail Pekerjaan
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={Briefcase} label="ID Karyawan" value={employee.kode_karyawan} />
                <DetailItem icon={Briefcase} label="Divisi / Kategori" value={employee.divisi} badge />
                <DetailItem icon={Briefcase} label="Kategori Kerja" value={employee.kategori_karyawan} badge />
                <DetailItem icon={Briefcase} label="Subtipe Kontrak" value={employee.subtipe_kontrak} badge />
                <DetailItem icon={Calendar} label="Tanggal Lahir" value={formatDate(employee.tanggal_lahir)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="size-4" /> Payroll & Perbankan
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={CreditCard} label="Metode Gaji" value={employee.tipe_gaji} badge />
                <DetailItem icon={CreditCard} label="Estimasi Gaji Pokok" value={formatCurrency(employee.gaji_pokok)} />
                <DetailItem icon={Building2} label="Nama Bank" value={employee.bank?.nama} />
                <DetailItem icon={CreditCard} label="Nomor Rekening" value={employee.bank?.rekening} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
