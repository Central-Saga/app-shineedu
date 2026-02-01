import { get } from "@/shared/infrastructure/api/httpClient";

export interface DashboardStats {
  total_murid: number;
  new_murid_this_month: number;
  total_guru: number;
  kelas_aktif: number;
  estimasi_omset: number;
}

export interface ActivityLog {
  description: string;
  causer: string;
  created_at: string;
  event: string;
}

export interface LatestEnrollment {
  id: string; // or number depending on backend UUID/ID
  murid_nama: string;
  program_nama: string;
  status: string;
  created_at: string;
}

export interface ChartData {
    name: string;
    total: number;
}

export interface DashboardData {
    stats: DashboardStats;
    recent_activities: ActivityLog[];
    latest_enrollments: LatestEnrollment[];
    chart_data: ChartData[];
}

export async function fetchDashboardStats(): Promise<DashboardData> {
  // Returns { stats: ..., recent_activities: ... } directly
  return await get<DashboardData>("dashboard/stats");
}
