import * as repo from "../../infrastructure/employees.repository";

export async function importEmployeesUsecase(file: File): Promise<void> {
  return repo.importEmployees(file);
}
