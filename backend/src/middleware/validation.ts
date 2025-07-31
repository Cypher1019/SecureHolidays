import { Request, Response, NextFunction } from "express";
import { body, validationResult, param, query } from "express-validator";
import crypto from "crypto";

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input sanitization function
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
};

// Enhanced password strength validator (8-16 characters)
export const validatePassword = (password: string, username?: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
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

// User registration validation
export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .custom((value) => {
      if (!EMAIL_REGEX.test(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),
  
  body("password")
    .isLength({ min: 8, max: 16 })
    .withMessage("Password must be between 8 and 16 characters long")
    .custom((value, { req }) => {
      const validation = validatePassword(value, req.body.email);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }
      return true;
    }),
  
  body("firstName")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
  
  body("lastName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
];

// Login validation
export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// Hotel creation/update validation
export const hotelValidation = [
  body("name")
    .isLength({ min: 3, max: 100 })
    .withMessage("Hotel name must be between 3 and 100 characters")
    .customSanitizer(sanitizeInput),
  
  body("city")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("City can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
  
  body("country")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Country can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
  
  body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .customSanitizer(sanitizeInput),
  
  body("type")
    .isIn(["Budget", "Business", "Luxury", "Resort", "Boutique", "Spa", "Casino", "Airport", "Extended Stay", "All-Inclusive"])
    .withMessage("Invalid hotel type"),
  
  body("adultCount")
    .isInt({ min: 1, max: 10 })
    .withMessage("Adult count must be between 1 and 10"),
  
  body("childCount")
    .isInt({ min: 0, max: 10 })
    .withMessage("Child count must be between 0 and 10"),
  
  body("pricePerNight")
    .isFloat({ min: 10, max: 10000 })
    .withMessage("Price per night must be between $10 and $10,000"),
  
  body("starRating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Star rating must be between 1 and 5"),
  
  body("facilities")
    .isArray({ min: 1, max: 20 })
    .withMessage("At least one facility is required, maximum 20"),
  
  body("facilities.*")
    .isLength({ min: 2, max: 50 })
    .withMessage("Facility name must be between 2 and 50 characters")
    .customSanitizer(sanitizeInput),
];

// Booking validation
export const bookingValidation = [
  body("firstName")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
  
  body("lastName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces")
    .customSanitizer(sanitizeInput),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("adultCount")
    .isInt({ min: 1, max: 10 })
    .withMessage("Adult count must be between 1 and 10"),
  
  body("childCount")
    .isInt({ min: 0, max: 10 })
    .withMessage("Child count must be between 0 and 10"),
  
  body("checkIn")
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
  
  body("checkOut")
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
export const searchValidation = [
  query("destination")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Destination must be between 2 and 100 characters")
    .customSanitizer(sanitizeInput),
  
  query("checkIn")
    .optional()
    .isISO8601()
    .withMessage("Invalid check-in date format"),
  
  query("checkOut")
    .optional()
    .isISO8601()
    .withMessage("Invalid check-out date format"),
  
  query("adultCount")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Adult count must be between 1 and 10"),
  
  query("childCount")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Child count must be between 0 and 10"),
  
  query("maxPrice")
    .optional()
    .isFloat({ min: 10, max: 10000 })
    .withMessage("Max price must be between $10 and $10,000"),
  
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
];

// ID parameter validation
export const idValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid ID format"),
];

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-csrf-token"] as string;
  const sessionToken = (req as any).session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      status: "error",
      message: "Invalid CSRF token",
    });
  }
  
  next();
};

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map(error => ({
        field: (error as any).path,
        message: error.msg,
        value: (error as any).value
      }))
    });
  }
  
  next();
};

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      status: "error",
      message: "No files were uploaded"
    });
  }
  
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  for (const fieldName in req.files) {
    const file = (req.files as any)[fieldName] as any;
    
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
    } else {
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