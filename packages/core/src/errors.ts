export enum DomainErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  TENANT_ISOLATION_VIOLATION = "TENANT_ISOLATION_VIOLATION",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export abstract class DomainError extends Error {
  public abstract readonly code: DomainErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly code = DomainErrorCode.VALIDATION_ERROR;
  constructor(message = "Invalid input data", details?: unknown) {
    super(message, 400, details);
  }
}

export class NotFoundError extends DomainError {
  public readonly code = DomainErrorCode.NOT_FOUND;
  constructor(resource = "Resource", details?: unknown) {
    super(`${resource} not found`, 404, details);
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = DomainErrorCode.UNAUTHORIZED;
  constructor(message = "Authentication required", details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends DomainError {
  public readonly code = DomainErrorCode.FORBIDDEN;
  constructor(message = "Access denied", details?: unknown) {
    super(message, 403, details);
  }
}

export class ConflictError extends DomainError {
  public readonly code = DomainErrorCode.CONFLICT;
  constructor(message = "Resource state conflict", details?: unknown) {
    super(message, 409, details);
  }
}

export class TenantIsolationError extends DomainError {
  public readonly code = DomainErrorCode.TENANT_ISOLATION_VIOLATION;
  constructor(message = "Cross-tenant access prohibited", details?: unknown) {
    super(message, 403, details);
  }
}
