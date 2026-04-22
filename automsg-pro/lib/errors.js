export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export function sanitizeError(error) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
    };
  }
  return {
    error: 'Erro interno. Tente novamente mais tarde.',
    code: 'INTERNAL_ERROR',
  };
}

export function handleApiError(res, error) {
  const sanitized = sanitizeError(error);
  return res.status(error.statusCode || 500).json(sanitized);
}