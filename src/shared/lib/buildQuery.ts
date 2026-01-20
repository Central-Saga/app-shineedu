/**
 * Build querystring from params. Skips undefined, null, and empty string.
 * Returns string without leading '?'.
 */
export function buildQuery(params: object): string {
  return Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}
