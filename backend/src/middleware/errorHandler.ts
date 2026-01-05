import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';
import { getEnv } from '../env.js';

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const env = getEnv();

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Custom HTTP errors
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code || 'HTTP_ERROR',
        ...(env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unknown errors
  const message = err instanceof Error ? err.message : 'Internal server error';
  const stack = err instanceof Error ? err.stack : undefined;

  // Log error in development
  if (env.NODE_ENV === 'development' && stack) {
    console.error('Unhandled error:', stack);
  }

  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : message,
      code: 'INTERNAL_ERROR',
      ...(env.NODE_ENV === 'development' && stack ? { stack } : {}),
    },
  });
}

