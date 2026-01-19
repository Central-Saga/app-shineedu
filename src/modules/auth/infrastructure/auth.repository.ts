import { post, get } from "@/shared/infrastructure/api/httpClient";
import type { LoginResponse, User } from "../domain/entities";

const AUTH = "auth";

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const data = await post<LoginResponse>(`${AUTH}/login`, { email, password });
  return data as LoginResponse;
}

export async function me(): Promise<User> {
  const data = await get<User>(`${AUTH}/me`);
  return data as User;
}

export async function logout(): Promise<void> {
  try {
    await post(`${AUTH}/logout`, {});
  } catch {
    // best effort: token mungkin sudah invalid
  }
}
