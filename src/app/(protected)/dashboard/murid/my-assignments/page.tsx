"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

interface AssignmentAssignment {
  id: number;
  assignment_id: number;
  assignment_title: string;
  assignment_description: string | null;
  due_date: string | null;
  assigned_at: string;
  sesi_date: string | null;
  kelas_name: string | null;
  submission: {
    id: number;
    status: string;
    submitted_at: string;
    score: number | null;
    feedback: string | null;
  } | null;
  is_submitted: boolean;
  is_overdue: boolean;
}

export default function MyAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignmentList, setAssignmentList] = useState<AssignmentAssignment[]>([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0, overdue: 0 });
  const [filter, setFilter] = useState<"all" | "submitted" | "pending" | "overdue">("all");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/murid/my-assignments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setAssignmentList(data.data.assignments || []);
      setStats({
        total: data.data.total || 0,
        submitted: data.data.submitted || 0,
        pending: data.data.pending || 0,
        overdue: data.data.overdue || 0,
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignmentList.filter((item) => {
    if (filter === "submitted") return item.is_submitted;
    if (filter === "pending") return !item.is_submitted;
    if (filter === "overdue") return item.is_overdue;
    return true;
  });

  const getStatusBadge = (item: AssignmentAssignment) => {
    if (item.is_submitted) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="mr-1 size-3" />
          Sudah Dikumpulkan
        </Badge>
      );
    }
    if (item.is_overdue) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 size-3" />
          Terlambat
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 size-3" />
        Belum Dikumpulkan
      </Badge>
    );
  };

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
        <h1 className="text-3xl font-bold text-slate-900">Tugas Saya</h1>
        <p className="text-slate-600 mt-1">Daftar tugas yang diberikan kepada Anda</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Tugas</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileText className="size-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sudah Dikumpulkan</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.submitted}</p>
              </div>
              <CheckCircle className="size-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Belum Dikumpulkan</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="size-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Terlambat</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="size-8 text-red-600" />
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
          variant={filter === "submitted" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("submitted")}
        >
          Sudah Dikumpulkan ({stats.submitted})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Belum Dikumpulkan ({stats.pending})
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("overdue")}
        >
          Terlambat ({stats.overdue})
        </Button>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Tidak ada tugas
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((item) => (
            <Card 
              key={item.id} 
              className={
                item.is_submitted 
                  ? "border-green-200 bg-green-50/30" 
                  : item.is_overdue 
                  ? "border-red-200 bg-red-50/30"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{item.assignment_title}</CardTitle>
                      {getStatusBadge(item)}
                      {item.submission?.score !== null && (
                        <Badge variant="outline" className="bg-blue-50">
                          <Award className="mr-1 size-3" />
                          Nilai: {item.submission.score}
                        </Badge>
                      )}
                    </div>
                    {item.assignment_description && (
                      <p className="text-sm text-slate-600 mt-2">{item.assignment_description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                  {item.kelas_name && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="size-4" />
                      {item.kelas_name}
                    </div>
                  )}
                  {item.sesi_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      Diberikan: {format(new Date(item.sesi_date), "dd MMM yyyy", { locale: idLocale })}
                    </div>
                  )}
                  {item.due_date && (
                    <div className={`flex items-center gap-1 ${item.is_overdue ? "text-red-600 font-semibold" : ""}`}>
                      <Clock className="size-4" />
                      Deadline: {format(new Date(item.due_date), "dd MMM yyyy", { locale: idLocale })}
                    </div>
                  )}
                  {item.submission?.submitted_at && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="size-4" />
                      Dikumpulkan: {format(new Date(item.submission.submitted_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                    </div>
                  )}
                </div>

                {item.submission?.feedback && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-3 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Feedback Guru:</p>
                    <p className="text-sm text-blue-800">{item.submission.feedback}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/dashboard/tugas/${item.assignment_id}`} className="flex-1">
                    <Button className="w-full">
                      <ExternalLink className="mr-2 size-4" />
                      {item.is_submitted ? "Lihat Detail" : "Kerjakan Tugas"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
