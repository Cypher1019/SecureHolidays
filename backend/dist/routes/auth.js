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
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const auth_1 = __importDefault(require("../middleware/auth"));
const session_1 = require("../middleware/session");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// User registration with enhanced password validation
router.post("/register", validation_1.registerValidation, validation_1.handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, firstName, lastName } = req.body;
        // Check if user already exists
        const existingUser = yield user_1.default.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "User with this email already exists"
            });
        }
        // Create new user
        const user = new user_1.default({
            email,
            password,
            firstName,
            lastName
        });
        yield user.save();
        // Generate JWT token
        const token = (0, session_1.generateJWT)(user._id.toString());
        // Set session
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            userId: user._id,
            token
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            status: "error",
            message: "Registration failed"
        });
    }
}));
router.post("/login", validation_1.loginValidation, validation_1.handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield user_1.default.findByEmail(email);
        if (!user) {
            return res.status(400).json({
                status: "error",
                message: "Invalid credentials"
            });
        }
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                status: "error",
                message: "Account is locked due to too many failed login attempts"
            });
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            // Increment failed login attempts
            yield user.incLoginAttempts();
            return res.status(400).json({
                status: "error",
                message: "Invalid credentials"
            });
        }
        // Reset login attempts on successful login
        yield user.resetLoginAttempts();
        // Generate JWT token
        const token = (0, session_1.generateJWT)(user._id.toString());
        // Set session
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        res.status(200).json({
            status: "success",
            message: "Login successful",
            userId: user._id,
            token,
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            status: "error",
            message: "Login failed"
        });
    }
}));
router.get("/validate-token", auth_1.default, (req, res) => {
    res.status(200).send({ userId: req.userId });
});
router.post("/logout", session_1.logout);
// Change password with password history validation
router.post("/change-password", auth_1.default, [
    (0, express_validator_1.check)("currentPassword", "Current password is required").notEmpty(),
    (0, express_validator_1.check)("newPassword", "New password is required").notEmpty(),
], validation_1.handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        const user = yield user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        // Verify current password
        const isCurrentPasswordValid = yield user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                status: "error",
                message: "Current password is incorrect"
            });
        }
        // Validate new password complexity
        const passwordValidation = user.validatePasswordComplexity(newPassword, user.email);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                status: "error",
                message: passwordValidation.errors.join(", ")
            });
        }
        // Check if new password was used before
        const isPasswordReused = yield user.isPasswordReused(newPassword);
        if (isPasswordReused) {
            return res.status(400).json({
                status: "error",
                message: "New password cannot be the same as any of your previous 5 passwords"
            });
        }
        // Add current password to history before changing
        yield user.addPasswordToHistory(user.password);
        // Update password
        user.password = newPassword;
        yield user.save();
        res.status(200).json({
            status: "success",
            message: "Password changed successfully"
        });
    }
    catch (error) {
        console.error("Password change error:", error);
        res.status(500).json({
            status: "error",
            message: "Password change failed"
        });
    }
}));
exports.default = router;
