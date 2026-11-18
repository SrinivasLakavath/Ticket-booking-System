const AppError = require('../errors/app.error')

/**
 * Shape every API error as { success, message, data } for CineSeat clients.
 */
function sendError(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  })
}

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate responses
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  })

  // Handle AppError (custom application errors)
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message)
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message)
    return sendError(res, 400, 'Validation Error', { details: errors })
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return sendError(res, 409, `Duplicate value for field: ${field}`)
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid data format')
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token')
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired')
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    return sendError(res, 400, 'Validation Error', { details: errors })
  }

  // Default error response (hide internal details in production)
  const statusCode = err.statusCode || 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Something went wrong'

  return sendError(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  )
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  return sendError(res, 404, `Route ${req.originalUrl} not found`)
}

/**
 * Async error wrapper - catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendError,
}
