import * as repo from "../../infrastructure/employees.repository";
import type { Employee } from "../../domain/entities";

export async function getEmployeeUsecase(id: number): Promise<Employee> {
  return repo.getEmployee(id);
}
