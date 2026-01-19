/**
 * Base application error.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly errors?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", errors?: unknown) {
    super(message, "UNAUTHORIZED", 401, errors);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", errors?: unknown) {
    super(message, "FORBIDDEN", 403, errors);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found", errors?: unknown) {
    super(message, "NOT_FOUND", 404, errors);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", errors?: unknown) {
    super(message, "CONFLICT", 409, errors);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation Error",
    public readonly validationErrors?: Record<string, string[] | { message: string }>
  ) {
    super(message, "VALIDATION", 422, validationErrors);
    this.name = "ValidationError";
  }
}
