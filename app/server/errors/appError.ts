import { logger } from '../logger';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Business logic errors
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      ErrorCode.NOT_FOUND,
      404,
      true,
      { resource, id }
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DUPLICATE_ENTRY, 409, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, false, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true);
  }
}

/**
 * Error handler middleware
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', { 
      message: error.message, 
      stack: error.stack 
    });
    
    return new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      false
    );
  }

  logger.error('Unknown error type', { error });
  
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_SERVER_ERROR,
    500,
    false
  );
}

/**
 * Async error wrapper
 */
export function asyncHandler<T extends any[]>(
  fn: (...args: T) => Promise<any>
) {
  return (...args: T) => {
    return Promise.resolve(fn(...args)).catch(error => {
      throw handleError(error);
    });
  };
}
