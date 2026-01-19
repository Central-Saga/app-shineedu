import * as authRepo from "../infrastructure/auth.repository";
import type { LoginResponse, User } from "../domain/entities";

export async function loginUsecase(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await authRepo.login(email, password);
  return { user: res.user, token: res.token };
}

export async function fetchMeUsecase(): Promise<User> {
  return authRepo.me();
}
