"use client";

import { create } from "zustand";
import { flattenPermissions } from "../domain/permission";
import type { User } from "../domain/entities";
import * as usecases from "../application/usecases";
import * as authRepo from "./auth.repository";

const STORAGE_KEY = "auth_token";

type State = {
  token: string | null;
  user: User | null;
  permissionsSet: Set<string>;
};

function buildPermissionsSet(user: User): Set<string> {
  return new Set(flattenPermissions(user));
}

function isSuperadmin(user: User): boolean {
  return (user.roles ?? []).some((r) => {
    const name = r?.name;
    if (typeof name !== "string") return false;
    return name.toLowerCase().replace(/\s+/g, "") === "superadmin";
  });
}

export const useAuthStore = create<State>(() => ({
  token: null,
  user: null,
  permissionsSet: new Set(),
}));

export const authStore = {
  getState: useAuthStore.getState,
  subscribe: useAuthStore.subscribe,

  hydrate(): void {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem(STORAGE_KEY);
    const token = typeof t === "string" ? t.trim() : "";
    useAuthStore.setState({ token: token || null });
  },

  clearSession(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "auth_token=; path=/; max-age=0";
    }
    useAuthStore.setState({
      token: null,
      user: null,
      permissionsSet: new Set(),
    });
  },

  async login(email: string, password: string): Promise<void> {
    const { user, token } = await usecases.loginUsecase(email, password);
    const tokenStr = typeof token === "string" ? token.trim() : String(token ?? "");
    if (typeof window !== "undefined" && tokenStr) {
      localStorage.setItem(STORAGE_KEY, tokenStr);
      document.cookie = `auth_token=${tokenStr}; path=/; max-age=86400; SameSite=Lax`;
    }
    useAuthStore.setState({
      token: tokenStr || null,
      user,
      permissionsSet: buildPermissionsSet(user),
    });
  },

  async fetchMe(): Promise<void> {
    const user = await usecases.fetchMeUsecase();
    useAuthStore.setState({
      user,
      permissionsSet: buildPermissionsSet(user),
    });
  },

  async logout(): Promise<void> {
    await authRepo.logout();
    authStore.clearSession();
  },

  hasPermission(name: string): boolean {
    const { user, permissionsSet } = useAuthStore.getState();
    if (!user) return false;
    if (isSuperadmin(user)) return true;
    return permissionsSet.has(name);
  },

  hasAnyPermission(names: string[]): boolean {
    return names.some((n) => authStore.hasPermission(n));
  },

  hasAllPermissions(names: string[]): boolean {
    return names.every((n) => authStore.hasPermission(n));
  },
};
