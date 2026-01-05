/**
 * Custom HTTP Error class
 * Used for throwing errors with specific status codes
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Common HTTP error factories
 */
export const HttpErrors = {
  badRequest: (message: string, details?: unknown) =>
    new HttpError(400, message, 'BAD_REQUEST', details),
  unauthorized: (message = 'Unauthorized') =>
    new HttpError(401, message, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') =>
    new HttpError(403, message, 'FORBIDDEN'),
  notFound: (message = 'Resource not found') =>
    new HttpError(404, message, 'NOT_FOUND'),
  conflict: (message: string, details?: unknown) =>
    new HttpError(409, message, 'CONFLICT', details),
  internal: (message = 'Internal server error') =>
    new HttpError(500, message, 'INTERNAL_ERROR'),
};

