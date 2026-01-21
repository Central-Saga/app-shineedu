import type { ValidationErrors } from "@/shared/domain/types";

/**
 * Map backend ValidationError.errors ke react-hook-form setError.
 * Setiap key di errors di-set via setError(key, { type: 'server', message }).
 * Untuk string[] diambil [0]; untuk { message } diambil .message.
 * @param setError - react-hook-form setError (dapat dari useForm)
 * @param errors - ValidationError.validationErrors dari backend
 */
export function applyValidationErrors(
  setError: (name: string, error: { type?: string; message: string }) => void,
  errors: ValidationErrors | undefined
): void {
  if (!errors || typeof errors !== "object") return;
  for (const [field, value] of Object.entries(errors)) {
    const message = Array.isArray(value)
      ? value[0]
      : value && typeof value === "object" && "message" in value
        ? (value as { message: string }).message
        : "Validasi gagal";
    if (typeof message === "string") {
      setError(field, { type: "server", message });
    }
  }
}
