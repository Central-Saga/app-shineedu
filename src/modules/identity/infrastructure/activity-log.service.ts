import { get } from "@/shared/infrastructure/api/httpClient";

export interface ActivityLog {
  id: number;
  description: string;
  event: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  properties: any;
  created_at: string;
  updated_at: string;
  causer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ActivityLogsParams {
  page?: number;
  per_page?: number;
  search?: string;
  causer_id?: number;
  subject_type?: string;
}

export interface PaginatedActivityLogs {
  data: ActivityLog[];
  current_page: number;
  last_page: number;
  total: number;
}

export const activityLogService = {
  getLogs: async (params?: ActivityLogsParams) => {
    try {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.per_page) query.append('per_page', params.per_page.toString());
        if (params?.search) query.append('search', params.search);
        if (params?.causer_id) query.append('causer_id', params.causer_id.toString());
        if (params?.subject_type) query.append('subject_type', params.subject_type);

        const res = await get<PaginatedActivityLogs>(`/activity-logs?${query.toString()}`);
        return res;
    } catch (e) {
        throw e;
    }
  },

  getLog: async (id: number) => {
    const res = await get<ActivityLog>(`/activity-logs/${id}`);
    return res;
  }
};
