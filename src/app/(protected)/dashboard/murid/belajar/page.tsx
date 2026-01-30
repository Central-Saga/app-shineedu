"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Calendar,
  Award
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProgressData {
  materi: {
    total: number;
    accessed: number;
    pending: number;
    completion_rate: number;
  };
  assignments: {
    total: number;
    submitted: number;
    pending: number;
    completion_rate: number;
    average_score: number | null;
  };
  recent_activity: {
    materi_accessed_7days: number;
    assignments_submitted_7days: number;
  };
}

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/murid/progress`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setProgress(data.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat progress");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Belajar</h1>
        <p className="text-slate-600 mt-1">Pantau progress belajar Anda</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Materi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Materi
            </CardTitle>
            <BookOpen className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.materi.total}</div>
            <p className="text-xs text-slate-600 mt-1">
              {progress.materi.accessed} sudah dipelajari
            </p>
            <Progress 
              value={progress.materi.completion_rate} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Total Tugas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Tugas
            </CardTitle>
            <FileText className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.assignments.total}</div>
            <p className="text-xs text-slate-600 mt-1">
              {progress.assignments.submitted} sudah dikumpulkan
            </p>
            <Progress 
              value={progress.assignments.completion_rate} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Nilai Rata-rata
            </CardTitle>
            <Award className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.assignments.average_score 
                ? progress.assignments.average_score.toFixed(1)
                : "-"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Dari {progress.assignments.submitted} tugas
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Aktivitas 7 Hari
            </CardTitle>
            <TrendingUp className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.recent_activity.materi_accessed_7days + 
               progress.recent_activity.assignments_submitted_7days}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {progress.recent_activity.materi_accessed_7days} materi, {" "}
              {progress.recent_activity.assignments_submitted_7days} tugas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Materi Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-blue-600" />
              Progress Materi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-2xl font-bold text-blue-600">
                {progress.materi.completion_rate}%
              </span>
            </div>
            <Progress value={progress.materi.completion_rate} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="size-4 text-green-600" />
                  Selesai
                </div>
                <div className="text-2xl font-bold">{progress.materi.accessed}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="size-4 text-amber-600" />
                  Pending
                </div>
                <div className="text-2xl font-bold">{progress.materi.pending}</div>
              </div>
            </div>

            <Link href="/dashboard/murid/my-materi">
              <Button className="w-full mt-4">
                Lihat Semua Materi
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Assignment Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-amber-600" />
              Progress Tugas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-2xl font-bold text-amber-600">
                {progress.assignments.completion_rate}%
              </span>
            </div>
            <Progress value={progress.assignments.completion_rate} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="size-4 text-green-600" />
                  Dikumpulkan
                </div>
                <div className="text-2xl font-bold">{progress.assignments.submitted}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="size-4 text-amber-600" />
                  Pending
                </div>
                <div className="text-2xl font-bold">{progress.assignments.pending}</div>
              </div>
            </div>

            <Link href="/dashboard/murid/my-assignments">
              <Button className="w-full mt-4">
                Lihat Semua Tugas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
