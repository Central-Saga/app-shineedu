import * as repo from "../../infrastructure/employees.repository";
import type { ListEmployeesParams } from "../../infrastructure/employees.repository";

export async function exportEmployeesUsecase(
  format: string,
  params: ListEmployeesParams
): Promise<void> {
  return repo.exportEmployees(format, params);
}
