import Joi from 'joi';
import { ValidationError } from '../errors/appError';
import { sanitizeInput, sanitizeObject } from '../sanitize';
import { isSafeFromPromptInjection } from '../promptInjection';
import { logger } from '../logger';

/**
 * Validate request body against Joi schema
 */
export function validateBody<T>(schema: Joi.Schema, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    logger.warn('Validation failed', { details });

    throw new ValidationError(
      'Validation failed',
      { details }
    );
  }

  return value as T;
}

/**
 * Sanitize and validate request data
 */
export function sanitizeAndValidate<T>(
  schema: Joi.Schema,
  data: any,
  checkPromptInjection: boolean = true
): T {
  // First sanitize the data
  const sanitized = sanitizeObject(data);

  // Check for prompt injection if required
  if (checkPromptInjection) {
    const dataString = JSON.stringify(sanitized);
    if (!isSafeFromPromptInjection(dataString)) {
      logger.warn('Prompt injection detected', { data: sanitized });
      throw new ValidationError(
        'Invalid input detected'
      );
    }
  }

  // Then validate against schema
  return validateBody(schema, sanitized);
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: Joi.Schema, searchParams: URLSearchParams): T {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(schema, params);
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'Password is required',
    }),
  
  phone: Joi.string()
    .pattern(/^[+]?[\d\s-()]{10,}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Please provide a valid URL',
      'any.required': 'URL is required',
    }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};
