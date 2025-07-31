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
exports.requireCSRF = exports.validateSession = exports.auditLog = exports.roleBasedRateLimit = exports.requireMethod = exports.requireOwnership = exports.requirePermission = exports.requireRole = exports.hasPermission = exports.Resource = exports.Permission = exports.UserRole = void 0;
const user_1 = __importDefault(require("../models/user"));
// User roles enum
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["HOTEL_OWNER"] = "hotel_owner";
    UserRole["MODERATOR"] = "moderator";
})(UserRole || (exports.UserRole = UserRole = {}));
// Permission levels
var Permission;
(function (Permission) {
    Permission["READ"] = "read";
    Permission["WRITE"] = "write";
    Permission["DELETE"] = "delete";
    Permission["ADMIN"] = "admin";
})(Permission || (exports.Permission = Permission = {}));
// Resource types
var Resource;
(function (Resource) {
    Resource["HOTEL"] = "hotel";
    Resource["BOOKING"] = "booking";
    Resource["USER"] = "user";
    Resource["SYSTEM"] = "system";
})(Resource || (exports.Resource = Resource = {}));
// Permission matrix
const PERMISSIONS = {
    [UserRole.USER]: {
        [Resource.HOTEL]: [Permission.READ],
        [Resource.BOOKING]: [Permission.READ, Permission.WRITE],
        [Resource.USER]: [Permission.READ, Permission.WRITE],
        [Resource.SYSTEM]: []
    },
    [UserRole.HOTEL_OWNER]: {
        [Resource.HOTEL]: [Permission.READ, Permission.WRITE, Permission.DELETE],
        [Resource.BOOKING]: [Permission.READ],
        [Resource.USER]: [Permission.READ, Permission.WRITE],
        [Resource.SYSTEM]: []
    },
    [UserRole.MODERATOR]: {
        [Resource.HOTEL]: [Permission.READ, Permission.WRITE],
        [Resource.BOOKING]: [Permission.READ, Permission.WRITE],
        [Resource.USER]: [Permission.READ, Permission.WRITE],
        [Resource.SYSTEM]: [Permission.READ]
    },
    [UserRole.ADMIN]: {
        [Resource.HOTEL]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
        [Resource.BOOKING]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
        [Resource.USER]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
        [Resource.SYSTEM]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN]
    }
};
// HTTP method to permission mapping
const METHOD_PERMISSIONS = {
    GET: Permission.READ,
    POST: Permission.WRITE,
    PUT: Permission.WRITE,
    PATCH: Permission.WRITE,
    DELETE: Permission.DELETE
};
// Check if user has permission for a resource
const hasPermission = (userRole, resource, permission) => {
    var _a;
    const userPermissions = ((_a = PERMISSIONS[userRole]) === null || _a === void 0 ? void 0 : _a[resource]) || [];
    return userPermissions.includes(permission) || userPermissions.includes(Permission.ADMIN);
};
exports.hasPermission = hasPermission;
// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    status: "error",
                    message: "Authentication required"
                });
            }
            const user = yield user_1.default.findById(req.userId);
            if (!user) {
                return res.status(401).json({
                    status: "error",
                    message: "User not found"
                });
            }
            // Add user role to request for later use
            req.userRole = user.role || UserRole.USER;
            if (!roles.includes(req.userRole)) {
                return res.status(403).json({
                    status: "error",
                    message: "Insufficient permissions"
                });
            }
            next();
        }
        catch (error) {
            console.error("Authorization error:", error);
            return res.status(500).json({
                status: "error",
                message: "Authorization check failed"
            });
        }
    });
};
exports.requireRole = requireRole;
// Resource-based authorization middleware
const requirePermission = (resource, permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    status: "error",
                    message: "Authentication required"
                });
            }
            const user = yield user_1.default.findById(req.userId);
            if (!user) {
                return res.status(401).json({
                    status: "error",
                    message: "User not found"
                });
            }
            const userRole = user.role || UserRole.USER;
            const method = req.method;
            const requiredPermission = METHOD_PERMISSIONS[method] || Permission.READ;
            if (!(0, exports.hasPermission)(userRole, resource, requiredPermission)) {
                return res.status(403).json({
                    status: "error",
                    message: "Insufficient permissions for this operation"
                });
            }
            next();
        }
        catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json({
                status: "error",
                message: "Permission check failed"
            });
        }
    });
};
exports.requirePermission = requirePermission;
// Owner-based authorization (users can only access their own resources)
const requireOwnership = (resourceType) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    status: "error",
                    message: "Authentication required"
                });
            }
            const user = yield user_1.default.findById(req.userId);
            if (!user) {
                return res.status(401).json({
                    status: "error",
                    message: "User not found"
                });
            }
            // Admins and moderators can access any resource
            if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
                return next();
            }
            const resourceId = req.params.id || req.params.hotelId || req.params.bookingId;
            if (!resourceId) {
                return res.status(400).json({
                    status: "error",
                    message: "Resource ID required"
                });
            }
            // Check ownership based on resource type
            let isOwner = false;
            switch (resourceType) {
                case 'hotel':
                    const Hotel = require('../models/hotel').default;
                    const hotel = yield Hotel.findById(resourceId);
                    isOwner = hotel && hotel.userId === req.userId;
                    break;
                case 'booking':
                    const HotelForBooking = require('../models/hotel').default;
                    const hotelWithBooking = yield HotelForBooking.findOne({
                        'bookings._id': resourceId,
                        'bookings.userId': req.userId
                    });
                    isOwner = !!hotelWithBooking;
                    break;
                case 'user':
                    isOwner = resourceId === req.userId;
                    break;
            }
            if (!isOwner) {
                return res.status(403).json({
                    status: "error",
                    message: "Access denied. You can only access your own resources."
                });
            }
            next();
        }
        catch (error) {
            console.error("Ownership check error:", error);
            return res.status(500).json({
                status: "error",
                message: "Ownership check failed"
            });
        }
    });
};
exports.requireOwnership = requireOwnership;
// Method access control middleware
const requireMethod = (methods) => {
    return (req, res, next) => {
        if (!methods.includes(req.method)) {
            return res.status(405).json({
                status: "error",
                message: `Method ${req.method} not allowed. Allowed methods: ${methods.join(', ')}`
            });
        }
        next();
    };
};
exports.requireMethod = requireMethod;
// Rate limiting based on user role
const roleBasedRateLimit = (userRole) => {
    const limits = {
        [UserRole.USER]: { windowMs: 15 * 60 * 1000, max: 100 },
        [UserRole.HOTEL_OWNER]: { windowMs: 15 * 60 * 1000, max: 200 },
        [UserRole.MODERATOR]: { windowMs: 15 * 60 * 1000, max: 500 },
        [UserRole.ADMIN]: { windowMs: 15 * 60 * 1000, max: 1000 }
    };
    const limit = limits[userRole] || limits[UserRole.USER];
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // This would typically be implemented with a rate limiting library
        // For now, we'll just pass through
        next();
    });
};
exports.roleBasedRateLimit = roleBasedRateLimit;
// Audit logging middleware
const auditLog = (action) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const startTime = Date.now();
        // Log the request
        console.log(`[AUDIT] ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.userId} - Action: ${action}`);
        // Override res.json to log responses
        const originalJson = res.json;
        res.json = function (data) {
            const duration = Date.now() - startTime;
            console.log(`[AUDIT] ${new Date().toISOString()} - Response: ${res.statusCode} - Duration: ${duration}ms`);
            return originalJson.call(this, data);
        };
        next();
    });
};
exports.auditLog = auditLog;
// Session validation middleware
const validateSession = (req, res, next) => {
    const token = req.cookies["auth_token"];
    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "No session token found"
        });
    }
    // Additional session validation can be added here
    // For example, checking if the session is expired, blacklisted, etc.
    next();
};
exports.validateSession = validateSession;
// CSRF protection for state-changing operations
const requireCSRF = (req, res, next) => {
    const method = req.method;
    // Only require CSRF for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken) {
            return res.status(403).json({
                status: "error",
                message: "CSRF token required for this operation"
            });
        }
        // Validate CSRF token (implementation depends on your session management)
        // This is a simplified version
        if (csrfToken.length < 32) {
            return res.status(403).json({
                status: "error",
                message: "Invalid CSRF token"
            });
        }
    }
    next();
};
exports.requireCSRF = requireCSRF;
