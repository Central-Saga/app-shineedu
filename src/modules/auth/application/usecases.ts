import * as authRepo from "../infrastructure/auth.repository";
import type { LoginResponse, User } from "../domain/entities";

export async function loginUsecase(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await authRepo.login(email, password);
  const token = res?.token != null ? String(res.token).trim() : "";
  if (!token) throw new Error("Login response missing token");
  return { user: res.user, token };
}

export async function fetchMeUsecase(): Promise<User> {
  return authRepo.me();
}
