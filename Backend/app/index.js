const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')

const adminRoutes = require('../routes/admin.routes')
const bookingRoutes = require('../routes/booking.routes')
const authRoutes = require('../routes/auth.routes')
const publicRoutes = require('../routes/public.routes')

const { authenticationMiddleware } = require('../middlewares/auth.middleware.js')
const { errorHandler, notFoundHandler } = require('../middlewares/error.middleware')
const Logger = require('../utils/logger')
const corsOptions = require('../config/cors.config')
const {
  helmetConfig,
  generalLimiter,
  authLimiter,
  bookingLimiter,
  mongoSanitizeConfig,
  xssConfig,
  hppConfig,
  compressionConfig,
} = require('../config/security.config')

const app = express()
const clientDistPath = path.join(__dirname, '..', '..', 'Frontend', 'dist')
const serveClient =
  process.env.NODE_ENV === 'production' && fs.existsSync(clientDistPath)

// Trust proxy - important for rate limiting and IP detection behind reverse proxies
app.set('trust proxy', 1)

// Security Middleware
app.use(helmetConfig) // Security headers
app.use(compressionConfig) // Compress responses
app.use(mongoSanitizeConfig) // Prevent NoSQL injection
app.use(xssConfig) // Prevent XSS attacks
app.use(hppConfig) // Prevent HTTP parameter pollution

// CORS Configuration
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: '10mb' })) // Limit body size to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(Logger.requestLogger)
}

// General rate limiting
app.use('/api', generalLimiter)

// Authentication middleware
app.use(authenticationMiddleware)

// Health / identity endpoints (no rate limiting)
const packageJson = require('../package.json')

function buildInfoPayload() {
  return {
    success: true,
    message: 'CineSeat API is running',
    data: {
      brand: 'CineSeat',
      product: "Srinivas Lakavath's ticket booking system",
      version: packageJson.version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  }
}

app.get('/health', (req, res) => res.json(buildInfoPayload()))

app.get('/api/info', (req, res) => res.json(buildInfoPayload()))

// Keep JSON root only when not serving the built React app
if (!serveClient) {
  app.get('/', (req, res) => res.json(buildInfoPayload()))
}

// Routes with specific rate limiters
app.use('/admin', adminRoutes)
app.use('/auth', authLimiter, authRoutes) // Stricter rate limiting for auth
app.use('/booking', bookingLimiter, bookingRoutes) // Rate limiting for bookings
app.use('/api', publicRoutes)

// Single-service deploy: Express serves Frontend/dist (Render one Web Service)
if (serveClient) {
  app.use(express.static(clientDistPath))
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/booking') ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/socket.io')
    ) {
      return next()
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

// 404 handler
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

module.exports = app
