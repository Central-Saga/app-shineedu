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
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.shineeducationbali.com/api/v2";

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
  const token = typeof t === "string" ? t.trim() : "";
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
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
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const isFormData = body instanceof FormData;
  
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body: isFormData ? body : (body != null ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) {
    return undefined as T;
  }

  return handleResponse<T>(res);
}

export async function get<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

/**
 * GET request that returns the full ApiResponse (including meta) for paginated endpoints.
 * Path may include query string, e.g. "users?page=1&q=foo".
 */
export async function getResponse<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...options, method: "GET", headers });
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
  query?: object,
  options?: RequestInit
): Promise<{ data: T; meta: PaginatedMeta }> {
  let fullPath = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  if (query && Object.keys(query).length > 0) {
    const qs = buildQuery(query);
    if (qs) fullPath += `?${qs}`;
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(fullPath, { ...options, method: "GET", headers });
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

export async function postResponse<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json: ApiResponse<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // ignore
    }
  }
  
  // Reuse response handling logic if possible, or just build the object
  if (res.ok) {
     return json as ApiResponse<T>;
  }
  
  // Re-use logic from handleResponse for errors
  return handleResponse<T>(res) as any;
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

/**
 * POST with FormData (multipart). Do not set Content-Type so browser sets boundary.
 */
export async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse<T>(res);
}

/**
 * PUT with FormData (multipart). Sends POST with _method=PUT for Laravel.
 */
export async function putFormData<T>(path: string, formData: FormData): Promise<T> {
  formData.append("_method", "PUT");
  return postFormData<T>(path, formData);
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
    const disposition = res.headers.get("Content-Disposition") || res.headers.get("content-disposition");
    if (disposition) {
      const match = disposition.match(/filename="?([^" ;]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
  }

  // Fallback filename if still not found
  if (!filename) {
    const format = (params as any)?.export || (params as any)?.format || "download";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const pathPart = path.split("/").pop() || "file";
    filename = `${pathPart}_${timestamp}.${format}`;
  }

  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function upload<T>(path: string, file: File, data?: Record<string, any>): Promise<T> {
  const url = `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const formData = new FormData();
  formData.append("file", file);

  if (data) {
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
  }

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

