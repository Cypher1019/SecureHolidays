"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.validateCSRFToken = exports.generateCSRFToken = exports.validateSession = exports.authenticateUser = exports.verifyJWT = exports.generateJWT = exports.sessionMiddleware = exports.sessionConfig = void 0;
const express_session_1 = __importDefault(require("express-session"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Session configuration
exports.sessionConfig = {
    secret: process.env.SESSION_SECRET || "your-super-secret-session-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict"
    },
    name: "booking-app-session" // Custom session name
};
// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "30d";
// Session middleware
exports.sessionMiddleware = (0, express_session_1.default)(exports.sessionConfig);
// JWT token generation
const generateJWT = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: "access" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateJWT = generateJWT;
// JWT token verification
const verifyJWT = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyJWT = verifyJWT;
// Authentication middleware with session and JWT fallback
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, try to get user from session
        if (req.session && req.session.userId) {
            req.userId = req.session.userId;
            return next();
        }
        // If session doesn't have user, try JWT from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = (0, exports.verifyJWT)(token);
            if (decoded && decoded.type === "access") {
                req.userId = decoded.userId;
                // Store in session for future requests
                if (req.session) {
                    req.session.userId = decoded.userId;
                }
                return next();
            }
        }
        // If neither session nor JWT works, return unauthorized
        return res.status(401).json({
            status: "error",
            message: "Authentication required"
        });
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            status: "error",
            message: "Authentication failed"
        });
    }
});
exports.authenticateUser = authenticateUser;
// Session validation middleware
const validateSession = (req, res, next) => {
    if (!req.session) {
        return res.status(401).json({
            status: "error",
            message: "Session not found"
        });
    }
    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "User not authenticated"
        });
    }
    next();
};
exports.validateSession = validateSession;
// CSRF token generation for session
const generateCSRFToken = (req) => {
    if (!req.session) {
        throw new Error("Session not available");
    }
    const token = require("crypto").randomBytes(32).toString("hex");
    req.session.csrfToken = token;
    return token;
};
exports.generateCSRFToken = generateCSRFToken;
// CSRF token validation for session
const validateCSRFToken = (req, res, next) => {
    var _a;
    const token = req.headers["x-csrf-token"];
    const sessionToken = (_a = req.session) === null || _a === void 0 ? void 0 : _a.csrfToken;
    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({
            status: "error",
            message: "Invalid CSRF token"
        });
    }
    next();
};
exports.validateCSRFToken = validateCSRFToken;
// Logout middleware
const logout = (req, res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
                return res.status(500).json({
                    status: "error",
                    message: "Logout failed"
                });
            }
            res.clearCookie("booking-app-session");
            return res.status(200).json({
                status: "success",
                message: "Logged out successfully"
            });
        });
    }
    else {
        return res.status(200).json({
            status: "success",
            message: "Logged out successfully"
        });
    }
};
exports.logout = logout;
