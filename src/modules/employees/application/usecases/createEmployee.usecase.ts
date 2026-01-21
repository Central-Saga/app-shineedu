import * as repo from "../../infrastructure/employees.repository";
import type { CreateEmployeePayload } from "../../domain/entities";
import type { Employee } from "../../domain/entities";

export async function createEmployeeUsecase(
  payload: CreateEmployeePayload
): Promise<Employee> {
  return repo.createEmployee(payload);
}
