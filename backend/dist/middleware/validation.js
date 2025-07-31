"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.handleValidationErrors = exports.validateCSRFToken = exports.generateCSRFToken = exports.idValidation = exports.searchValidation = exports.bookingValidation = exports.hotelValidation = exports.loginValidation = exports.registerValidation = exports.validatePassword = exports.sanitizeInput = void 0;
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Input sanitization function
const sanitizeInput = (input) => {
    return input
        .trim()
        .replace(/[<>]/g, "") // Remove potential HTML tags
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+=/gi, ""); // Remove event handlers
};
exports.sanitizeInput = sanitizeInput;
// Enhanced password strength validator (8-16 characters)
const validatePassword = (password, username) => {
    const errors = [];
    // Check length (8-16 characters)
    if (password.length < 8 || password.length > 16) {
        errors.push("Password must be between 8 and 16 characters long");
    }
    // Check for lowercase characters
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    // Check for uppercase characters
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    // Check for numbers
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    // Check for special characters
    if (!/[@$!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$!%*?&)");
    }
    // Check if password is same as username
    if (username && password.toLowerCase() === username.toLowerCase()) {
        errors.push("Password cannot be the same as username");
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePassword = validatePassword;
// User registration validation
exports.registerValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address")
        .custom((value) => {
        if (!EMAIL_REGEX.test(value)) {
            throw new Error("Invalid email format");
        }
        return true;
    }),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8, max: 16 })
        .withMessage("Password must be between 8 and 16 characters long")
        .custom((value, { req }) => {
        const validation = (0, exports.validatePassword)(value, req.body.email);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(", "));
        }
        return true;
    }),
    (0, express_validator_1.body)("firstName")
        .isLength({ min: 2, max: 50 })
        .withMessage("First name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("First name can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("lastName")
        .isLength({ min: 2, max: 50 })
        .withMessage("Last name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Last name can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
];
// Login validation
exports.loginValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required"),
];
// Hotel creation/update validation
exports.hotelValidation = [
    (0, express_validator_1.body)("name")
        .isLength({ min: 3, max: 100 })
        .withMessage("Hotel name must be between 3 and 100 characters")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("city")
        .isLength({ min: 2, max: 50 })
        .withMessage("City must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("City can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("country")
        .isLength({ min: 2, max: 50 })
        .withMessage("Country must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Country can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("description")
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be between 10 and 1000 characters")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("type")
        .isIn(["Budget", "Business", "Luxury", "Resort", "Boutique", "Spa", "Casino", "Airport", "Extended Stay", "All-Inclusive"])
        .withMessage("Invalid hotel type"),
    (0, express_validator_1.body)("adultCount")
        .isInt({ min: 1, max: 10 })
        .withMessage("Adult count must be between 1 and 10"),
    (0, express_validator_1.body)("childCount")
        .isInt({ min: 0, max: 10 })
        .withMessage("Child count must be between 0 and 10"),
    (0, express_validator_1.body)("pricePerNight")
        .isFloat({ min: 10, max: 10000 })
        .withMessage("Price per night must be between $10 and $10,000"),
    (0, express_validator_1.body)("starRating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Star rating must be between 1 and 5"),
    (0, express_validator_1.body)("facilities")
        .isArray({ min: 1, max: 20 })
        .withMessage("At least one facility is required, maximum 20"),
    (0, express_validator_1.body)("facilities.*")
        .isLength({ min: 2, max: 50 })
        .withMessage("Facility name must be between 2 and 50 characters")
        .customSanitizer(exports.sanitizeInput),
];
// Booking validation
exports.bookingValidation = [
    (0, express_validator_1.body)("firstName")
        .isLength({ min: 2, max: 50 })
        .withMessage("First name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("First name can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("lastName")
        .isLength({ min: 2, max: 50 })
        .withMessage("Last name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Last name can only contain letters and spaces")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("adultCount")
        .isInt({ min: 1, max: 10 })
        .withMessage("Adult count must be between 1 and 10"),
    (0, express_validator_1.body)("childCount")
        .isInt({ min: 0, max: 10 })
        .withMessage("Child count must be between 0 and 10"),
    (0, express_validator_1.body)("checkIn")
        .isISO8601()
        .withMessage("Invalid check-in date format")
        .custom((value) => {
        const checkIn = new Date(value);
        const now = new Date();
        if (checkIn <= now) {
            throw new Error("Check-in date must be in the future");
        }
        return true;
    }),
    (0, express_validator_1.body)("checkOut")
        .isISO8601()
        .withMessage("Invalid check-out date format")
        .custom((value, { req }) => {
        const checkOut = new Date(value);
        const checkIn = new Date(req.body.checkIn);
        if (checkOut <= checkIn) {
            throw new Error("Check-out date must be after check-in date");
        }
        return true;
    }),
];
// Search parameters validation
exports.searchValidation = [
    (0, express_validator_1.query)("destination")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Destination must be between 2 and 100 characters")
        .customSanitizer(exports.sanitizeInput),
    (0, express_validator_1.query)("checkIn")
        .optional()
        .isISO8601()
        .withMessage("Invalid check-in date format"),
    (0, express_validator_1.query)("checkOut")
        .optional()
        .isISO8601()
        .withMessage("Invalid check-out date format"),
    (0, express_validator_1.query)("adultCount")
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage("Adult count must be between 1 and 10"),
    (0, express_validator_1.query)("childCount")
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage("Child count must be between 0 and 10"),
    (0, express_validator_1.query)("maxPrice")
        .optional()
        .isFloat({ min: 10, max: 10000 })
        .withMessage("Max price must be between $10 and $10,000"),
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
];
// ID parameter validation
exports.idValidation = [
    (0, express_validator_1.param)("id")
        .isMongoId()
        .withMessage("Invalid ID format"),
];
// CSRF token generation and validation
const generateCSRFToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.generateCSRFToken = generateCSRFToken;
const validateCSRFToken = (req, res, next) => {
    var _a;
    const token = req.headers["x-csrf-token"];
    const sessionToken = (_a = req.session) === null || _a === void 0 ? void 0 : _a.csrfToken;
    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({
            status: "error",
            message: "Invalid CSRF token",
        });
    }
    next();
};
exports.validateCSRFToken = validateCSRFToken;
// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            message: "Validation failed",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// File upload validation
const validateFileUpload = (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            status: "error",
            message: "No files were uploaded"
        });
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const fieldName in req.files) {
        const file = req.files[fieldName];
        if (Array.isArray(file)) {
            for (const f of file) {
                if (!allowedTypes.includes(f.mimetype)) {
                    return res.status(400).json({
                        status: "error",
                        message: `Invalid file type for ${fieldName}. Only JPEG, PNG, and WebP are allowed`
                    });
                }
                if (f.size > maxSize) {
                    return res.status(400).json({
                        status: "error",
                        message: `File ${f.name} is too large. Maximum size is 5MB`
                    });
                }
            }
        }
        else {
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    status: "error",
                    message: `Invalid file type for ${fieldName}. Only JPEG, PNG, and WebP are allowed`
                });
            }
            if (file.size > maxSize) {
                return res.status(400).json({
                    status: "error",
                    message: `File ${file.name} is too large. Maximum size is 5MB`
                });
            }
        }
    }
    next();
};
exports.validateFileUpload = validateFileUpload;
