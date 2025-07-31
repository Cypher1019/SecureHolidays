import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import { Express } from "express";

// Rate limiting configuration
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  "Too many authentication attempts, please try again later"
);

export const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  "Too many API requests, please try again later"
);

export const bookingLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 booking attempts per hour
  "Too many booking attempts, please try again later"
);

// CORS configuration
export const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com;"
  );

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // XSS Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions Policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  next();
};

// Request size limiter
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers["content-length"] || "0");
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      status: "error",
      message: "Request entity too large",
    });
  }

  next();
};

// Apply security middleware to app
export const applySecurityMiddleware = (app: Express) => {
  // Basic security
  app.use(helmet());
  
  // CORS
  app.use(cors(corsOptions));
  
  // Security headers
  app.use(securityHeaders);
  
  // Request size limiting
  app.use(requestSizeLimiter);
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp());
  
  // Prevent NoSQL injection
  app.use(mongoSanitize());
  
  // Prevent XSS attacks
  app.use(xss());
  
  // Body parsing with limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  
  // Rate limiting
  app.use("/api/auth", authLimiter);
  app.use("/api/hotels", apiLimiter);
  app.use("/api/my-bookings", bookingLimiter);
  app.use("/api", apiLimiter);
};

// Error handling for security-related errors
export const securityErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      status: "error",
      message: "Request entity too large",
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON payload",
    });
  }

  next(error);
}; 