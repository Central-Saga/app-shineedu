import * as repo from "../../infrastructure/employees.repository";

export async function deleteEmployeeUsecase(id: number): Promise<void> {
  return repo.deleteEmployee(id);
}
