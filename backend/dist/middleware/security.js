"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityErrorHandler = exports.applySecurityMiddleware = exports.requestSizeLimiter = exports.securityHeaders = exports.corsOptions = exports.bookingLimiter = exports.apiLimiter = exports.authLimiter = void 0;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const cors_1 = __importDefault(require("cors"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
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
exports.authLimiter = createRateLimit(15 * 60 * 1000, // 15 minutes
5, // 5 requests per window
"Too many authentication attempts, please try again later");
exports.apiLimiter = createRateLimit(15 * 60 * 1000, // 15 minutes
100, // 100 requests per window
"Too many API requests, please try again later");
exports.bookingLimiter = createRateLimit(60 * 60 * 1000, // 1 hour
10, // 10 booking attempts per hour
"Too many booking attempts, please try again later");
// CORS configuration
exports.corsOptions = {
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
const securityHeaders = (req, res, next) => {
    // Content Security Policy
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com;");
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions Policy
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
};
exports.securityHeaders = securityHeaders;
// Request size limiter
const requestSizeLimiter = (req, res, next) => {
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
exports.requestSizeLimiter = requestSizeLimiter;
// Apply security middleware to app
const applySecurityMiddleware = (app) => {
    // Basic security
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)(exports.corsOptions));
    // Security headers
    app.use(exports.securityHeaders);
    // Request size limiting
    app.use(exports.requestSizeLimiter);
    // Prevent HTTP Parameter Pollution
    app.use((0, hpp_1.default)());
    // Prevent NoSQL injection
    app.use((0, express_mongo_sanitize_1.default)());
    // Prevent XSS attacks
    app.use((0, xss_clean_1.default)());
    // Body parsing with limits
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    // Rate limiting
    app.use("/api/auth", exports.authLimiter);
    app.use("/api/hotels", exports.apiLimiter);
    app.use("/api/my-bookings", exports.bookingLimiter);
    app.use("/api", exports.apiLimiter);
};
exports.applySecurityMiddleware = applySecurityMiddleware;
// Error handling for security-related errors
const securityErrorHandler = (error, req, res, next) => {
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
exports.securityErrorHandler = securityErrorHandler;
