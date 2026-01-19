import { toast } from "sonner";
import type { ApiResponse, PaginatedMeta } from "@/shared/domain/types";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

const BASE =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "";

let tokenGetter: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokenGetter(fn: () => string | null): void {
  tokenGetter = fn;
}

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

function getAuthHeaders(): Record<string, string> {
  const t = tokenGetter?.() ?? null;
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: ApiResponse<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // 204 or non-JSON
    }
  }

  const message = (json?.message ?? res.statusText) || "Terjadi kesalahan";

  if (res.ok) {
    return (json?.data as T) ?? (undefined as T);
  }

  // success === false or HTTP error
  const success = json?.success ?? false;
  const payload = success ? undefined : json;

  switch (res.status) {
    case 401: {
      onUnauthorized?.();
      throw new UnauthorizedError(message, payload?.errors);
    }
    case 403: {
      toast.error(message || "Tidak punya akses");
      throw new ForbiddenError(message, payload?.errors);
    }
    case 404: {
      throw new NotFoundError(message, payload?.errors);
    }
    case 409: {
      toast.error(message);
      throw new ConflictError(message, payload?.errors);
    }
    case 422: {
      toast.error(message);
      throw new ValidationError(
        message,
        payload?.errors as Record<string, string[] | { message: string }> | undefined
      );
    }
    default:
      toast.error(message);
      throw new AppError(message, undefined, res.status, payload?.errors);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  return handleResponse<T>(res);
}

export async function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function getPaginated<T>(
  path: string
): Promise<{ data: T; meta: PaginatedMeta }> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, { method: "GET", headers });
  const json = (await res.json()) as ApiResponse<T> & { meta?: PaginatedMeta };
  if (!res.ok) {
    const message = (json?.message ?? res.statusText) || "Terjadi kesalahan";
    switch (res.status) {
      case 401:
        onUnauthorized?.();
        throw new UnauthorizedError(message, json?.errors);
      case 403:
        toast.error(message || "Tidak punya akses");
        throw new ForbiddenError(message, json?.errors);
      case 404:
        throw new NotFoundError(message, json?.errors);
      case 409:
        toast.error(message);
        throw new ConflictError(message, json?.errors);
      case 422:
        toast.error(message);
        throw new ValidationError(
          message,
          json?.errors as Record<string, string[] | { message: string }> | undefined
        );
      default:
        toast.error(message);
        throw new AppError(message, undefined, res.status, json?.errors);
    }
  }
  return {
    data: json.data as T,
    meta: (json.meta ?? {
      current_page: 1,
      per_page: 15,
      total: 0,
      last_page: 1,
      from: null,
      to: null,
    }) as PaginatedMeta,
  };
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export async function del<T = void>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
