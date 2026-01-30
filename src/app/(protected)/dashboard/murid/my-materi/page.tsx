"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  ExternalLink,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

interface MateriAssignment {
  id: number;
  materi_id: number;
  materi_title: string;
  materi_description: string | null;
  items_count: number;
  assigned_at: string;
  accessed_at: string | null;
  is_accessed: boolean;
  sesi_date: string | null;
  kelas_name: string | null;
}

export default function MyMateriPage() {
  const [loading, setLoading] = useState(true);
  const [materiList, setMateriList] = useState<MateriAssignment[]>([]);
  const [stats, setStats] = useState({ total: 0, accessed: 0, pending: 0 });
  const [filter, setFilter] = useState<"all" | "accessed" | "pending">("all");

  useEffect(() => {
    fetchMateri();
  }, []);

  const fetchMateri = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/murid/my-materi`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setMateriList(data.data.materi || []);
      setStats({
        total: data.data.total || 0,
        accessed: data.data.accessed || 0,
        pending: data.data.pending || 0,
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat materi");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAccessed = async (materiAssignmentId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/murid/materi/${materiAssignmentId}/mark-accessed`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to mark");

      toast.success("Materi ditandai sudah diakses");
      fetchMateri(); // Refresh
    } catch (error) {
      console.error(error);
      toast.error("Gagal menandai materi");
    }
  };

  const filteredMateri = materiList.filter((item) => {
    if (filter === "accessed") return item.is_accessed;
    if (filter === "pending") return !item.is_accessed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Materi Saya</h1>
        <p className="text-slate-600 mt-1">Daftar materi yang diberikan kepada Anda</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Materi</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <BookOpen className="size-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sudah Dipelajari</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.accessed}</p>
              </div>
              <CheckCircle className="size-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Belum Dipelajari</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="size-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Semua ({stats.total})
        </Button>
        <Button
          variant={filter === "accessed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("accessed")}
        >
          Sudah Dipelajari ({stats.accessed})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Belum Dipelajari ({stats.pending})
        </Button>
      </div>

      {/* Materi List */}
      <div className="space-y-4">
        {filteredMateri.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Tidak ada materi
            </CardContent>
          </Card>
        ) : (
          filteredMateri.map((item) => (
            <Card key={item.id} className={item.is_accessed ? "border-green-200 bg-green-50/30" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.materi_title}</CardTitle>
                      {item.is_accessed ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 size-3" />
                          Sudah Dipelajari
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 size-3" />
                          Belum Dipelajari
                        </Badge>
                      )}
                    </div>
                    {item.materi_description && (
                      <p className="text-sm text-slate-600 mt-2">{item.materi_description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <FileText className="size-4" />
                    {item.items_count} item
                  </div>
                  {item.kelas_name && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="size-4" />
                      {item.kelas_name}
                    </div>
                  )}
                  {item.sesi_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      {format(new Date(item.sesi_date), "dd MMM yyyy", { locale: idLocale })}
                    </div>
                  )}
                  {item.accessed_at && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="size-4" />
                      Diakses: {format(new Date(item.accessed_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/materi-modul/${item.materi_id}`} className="flex-1">
                    <Button className="w-full">
                      <ExternalLink className="mr-2 size-4" />
                      Buka Materi
                    </Button>
                  </Link>
                  {!item.is_accessed && (
                    <Button
                      variant="outline"
                      onClick={() => handleMarkAccessed(item.id)}
                    >
                      <CheckCircle className="mr-2 size-4" />
                      Tandai Sudah Dipelajari
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
