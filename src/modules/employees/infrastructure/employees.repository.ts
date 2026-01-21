import {
  get,
  getResponse,
  post,
  put,
  del,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "../domain/entities";

export interface ListEmployeesParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: "aktif" | "nonaktif";
  kategori_karyawan?: string;
  tipe_gaji?: string;
  sort_by?:
    | "kode_karyawan"
    | "status"
    | "kategori_karyawan"
    | "tipe_gaji"
    | "gaji_pokok"
    | "created_at"
    | "updated_at";
  sort_dir?: "asc" | "desc";
}

export async function listEmployees(
  params: ListEmployeesParams = {}
): Promise<{ items: Employee[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Employee[]>(
    qs ? `employees?${qs}` : "employees"
  );
  return { items: (res.data ?? []) as Employee[], meta: res.meta ?? DEFAULT_META };
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<Employee> {
  const data = await post<Employee>("employees", payload);
  return data as Employee;
}

export async function getEmployee(id: number): Promise<Employee> {
  const data = await get<Employee>(`employees/${id}`);
  return data as Employee;
}

export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  const data = await put<Employee>(`employees/${id}`, payload);
  return data as Employee;
}

export async function deleteEmployee(id: number): Promise<void> {
  await del(`employees/${id}`);
}
