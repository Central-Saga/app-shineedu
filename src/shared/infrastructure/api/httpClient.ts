import { toast } from "sonner";
import { buildQuery } from "@/shared/lib/buildQuery";
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
    if (json?.success === false) {
      // Backend returns 2xx but success=false → treat as error by status
      const payload = json;
      switch (res.status) {
        case 401:
          onUnauthorized?.();
          throw new UnauthorizedError(message, payload?.errors);
        case 403:
          throw new ForbiddenError(message, payload?.errors);
        case 409:
          toast.error(message);
          throw new ConflictError(message, payload?.errors);
        case 422:
          toast.error(message);
          throw new ValidationError(
            message,
            payload?.errors as Record<string, string[] | { message: string }> | undefined
          );
        default:
          toast.error(message);
          throw new AppError(message, undefined, res.status, payload?.errors);
      }
    }
    return (json?.data as T) ?? (undefined as T);
  }

  // HTTP error
  const payload = json;

  switch (res.status) {
    case 401: {
      onUnauthorized?.();
      throw new UnauthorizedError(message, payload?.errors);
    }
    case 403: {
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
  const isFormData = body instanceof FormData;
  
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : (body != null ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) {
    return undefined as T;
  }

  return handleResponse<T>(res);
}

export async function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

/**
 * GET request that returns the full ApiResponse (including meta) for paginated endpoints.
 * Path may include query string, e.g. "users?page=1&q=foo".
 */
export async function getResponse<T>(path: string): Promise<ApiResponse<T>> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, { method: "GET", headers });
  const text = await res.text();
  let json: ApiResponse<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // ignore
    }
  }
  const message = (json?.message ?? res.statusText) || "Terjadi kesalahan";

  if (res.ok) {
    if (json?.success === false) {
      switch (res.status) {
        case 401:
          onUnauthorized?.();
          throw new UnauthorizedError(message, json?.errors);
        case 403:
          throw new ForbiddenError(message, json?.errors);
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
    return json as ApiResponse<T>;
  }

  switch (res.status) {
    case 401:
      onUnauthorized?.();
      throw new UnauthorizedError(message, json?.errors);
    case 403:
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

export const DEFAULT_META: PaginatedMeta = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
};

export async function getPaginated<T>(
  path: string,
  query?: object
): Promise<{ data: T; meta: PaginatedMeta }> {
  let fullPath = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  if (query && Object.keys(query).length > 0) {
    const qs = buildQuery(query);
    if (qs) fullPath += `?${qs}`;
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(fullPath, { method: "GET", headers });
  const text = await res.text();
  let json: (ApiResponse<T> & { meta?: PaginatedMeta }) | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T> & { meta?: PaginatedMeta };
    } catch {
      // ignore
    }
  }
  const message = (json?.message ?? res.statusText) || "Terjadi kesalahan";

  if (res.ok) {
    if (json?.success === false) {
      switch (res.status) {
        case 401:
          onUnauthorized?.();
          throw new UnauthorizedError(message, json?.errors);
        case 403:
          throw new ForbiddenError(message, json?.errors);
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
      data: (json?.data as T) ?? ([] as T),
      meta: (json?.meta ?? DEFAULT_META) as PaginatedMeta,
    };
  }

  switch (res.status) {
    case 401:
      onUnauthorized?.();
      throw new UnauthorizedError(message, json?.errors);
    case 403:
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

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export async function del<T = void>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

export async function download(path: string, params?: object, filename?: string): Promise<void> {
  const qs = params ? buildQuery(params) : "";
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}${qs ? `?${qs}` : ""}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    await handleResponse(res);
    return;
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  
  if (!filename) {
    const disposition = res.headers.get("Content-Disposition");
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
  }

  if (filename) a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function upload<T>(path: string, file: File): Promise<T> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse<T>(res);
}
