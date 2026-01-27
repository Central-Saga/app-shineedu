import { get, post, put, getResponse, postResponse, download } from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import { PaginatedMeta } from "@/shared/domain/types";
import { 
    Sesi, 
    AbsensiItem, 
    LogbookSesi, 
    LogbookMuridItem, 
    GenerateSesiRequest,
    UpdateSesiRequest,
    BulkAbsensiRequest,
    BulkLogbookMuridRequest
} from "../types";

const BASE_URL = "sesi"; // Adjust if needed relative to /api/v2

export const sesiApi = {
    // List Sesi for a Class
    getSesiByKelas: async (kelasId: number, params: Record<string, string | number | boolean | undefined>): Promise<{ data: Sesi[]; meta: PaginatedMeta }> => {
        const qs = buildQuery(params);
        // Endpoint structure: /api/v2/kelas/{kelas_id}/sesi
        // Or /api/v2/sesi?kelas_id={id}
        // User prompt: GET /api/v2/kelas/{kelas_id}/sesi?from=...
        const url = `kelas/${kelasId}/sesi${qs ? `?${qs}` : ""}`;
        const res = await getResponse<Sesi[]>(url);
        return { data: res.data || [], meta: res.meta as PaginatedMeta };
    },

    getSesiDetail: async (id: number): Promise<Sesi> => {
        return await get<Sesi>(`${BASE_URL}/${id}`);
    },

    generateSesi: async (kelasId: number, payload: GenerateSesiRequest) => {
        return await postResponse<{ count: number }>(`kelas/${kelasId}/sesi/generate`, payload);
    },

    updateSesi: async (id: number, payload: UpdateSesiRequest) => {
        return await put<Sesi>(`${BASE_URL}/${id}`, payload);
    },

    syncAnggota: async (id: number) => {
        return await post(`${BASE_URL}/${id}/sync-anggota`, {});
    },

    // Absensi
    getAbsensi: async (sesiId: number): Promise<AbsensiItem[]> => {
        const res = await getResponse<AbsensiItem[]>(`${BASE_URL}/${sesiId}/absensi`);
        return res.data || [];
    },

    updateAbsensiBulk: async (sesiId: number, payload: BulkAbsensiRequest) => {
        return await put(`${BASE_URL}/${sesiId}/absensi/bulk`, payload);
    },

    moveAttendance: async (sesiId: number, enrollmentId: number, targetSessionId: number) => {
        return await post(`${BASE_URL}/${sesiId}/absensi/move`, { 
            enrollment_id: enrollmentId, 
            target_session_id: targetSessionId 
        });
    },

    // Logbook Sesi
    getLogbook: async (sesiId: number): Promise<LogbookSesi> => {
       try {
           return await get<LogbookSesi>(`${BASE_URL}/${sesiId}/logbook`);
       } catch {
           // If 404/null, return empty object
           return { sesi_id: sesiId }; 
       }
    },

    updateLogbook: async (sesiId: number, payload: LogbookSesi) => {
        return await put(`${BASE_URL}/${sesiId}/logbook`, payload);
    },

    // Logbook Murid
    getLogbookMurid: async (sesiId: number): Promise<LogbookMuridItem[]> => {
         const res = await getResponse<LogbookMuridItem[]>(`${BASE_URL}/${sesiId}/logbook-murid`);
         return res.data || [];
    },

    updateLogbookMuridBulk: async (sesiId: number, payload: BulkLogbookMuridRequest) => {
        return await put(`${BASE_URL}/${sesiId}/logbook-murid/bulk`, payload);
    },

    getLogbooksByMurid: async (muridId: number): Promise<LogbookMuridItem[]> => {
        const res = await getResponse<LogbookMuridItem[]>(`murid/${muridId}/logbook`);
        return res.data || [];
    },

    getLogbooksByKelas: async (kelasId: number): Promise<LogbookSesi[]> => {
        const res = await getResponse<LogbookSesi[]>(`kelas/${kelasId}/logbook`);
        return res.data || [];
    },

    exportSesi: async (kelasId: number, format: string, params: Record<string, unknown>) => {
        return await download(`kelas/${kelasId}/sesi/export`, { ...params, export: format });
    },

    exportAllSesi: async (format: string, params: Record<string, unknown>) => {
        return await download(`${BASE_URL}/export`, { ...params, export: format });
    }
};
