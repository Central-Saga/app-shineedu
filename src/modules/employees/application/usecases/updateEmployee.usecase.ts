import * as repo from "../../infrastructure/employees.repository";
import type { UpdateEmployeePayload } from "../../domain/entities";
import type { Employee } from "../../domain/entities";

export async function updateEmployeeUsecase(
  id: number,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  return repo.updateEmployee(id, payload);
}
