import * as repo from "../../infrastructure/employees.repository";
import type { ListEmployeesParams } from "../../infrastructure/employees.repository";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { Employee } from "../../domain/entities";

export async function getEmployeesUsecase(
  params: ListEmployeesParams = {}
): Promise<{ items: Employee[]; meta: PaginatedMeta }> {
  return repo.listEmployees(params);
}
