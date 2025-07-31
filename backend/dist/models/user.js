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
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authorization_1 = require("../middleware/authorization");
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"]
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [50, "First name cannot exceed 50 characters"],
        match: [/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"]
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [50, "Last name cannot exceed 50 characters"],
        match: [/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"]
    },
    role: {
        type: String,
        enum: Object.values(authorization_1.UserRole),
        default: authorization_1.UserRole.USER
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    accountLockedUntil: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    sessionTokens: [{
            token: String,
            createdAt: { type: Date, default: Date.now },
            expiresAt: Date,
            userAgent: String,
            ipAddress: String
        }],
    // Password history tracking
    previousPasswords: [{
            password: String,
            createdAt: { type: Date, default: Date.now }
        }],
    passwordCreated: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Indexes for performance and security
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ accountLocked: 1 });
userSchema.index({ "sessionTokens.token": 1 });
// Password hashing middleware
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            this.password = yield bcryptjs_1.default.hash(this.password, 12); // Increased salt rounds for better security
        }
        next();
    });
});
// Virtual for full name
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Virtual for account status
userSchema.virtual("isLocked").get(function () {
    return !!(this.accountLocked && this.accountLockedUntil && this.accountLockedUntil > new Date());
});
// Instance method to check password
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    });
};
// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.accountLockedUntil && this.accountLockedUntil < new Date()) {
        return this.updateOne({
            $unset: { accountLockedUntil: 1 },
            $set: { failedLoginAttempts: 1 }
        });
    }
    const updates = { $inc: { failedLoginAttempts: 1 } };
    // Lock account after 5 failed attempts for 2 hours
    if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            accountLocked: true,
            accountLockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        };
    }
    return this.updateOne(updates);
};
// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $unset: {
            failedLoginAttempts: 1,
            accountLockedUntil: 1
        },
        $set: {
            accountLocked: false,
            lastLogin: new Date()
        }
    });
};
// Static method to find by email (case insensitive)
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};
// Instance method to validate password complexity
userSchema.methods.validatePasswordComplexity = function (password, username) {
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
// Instance method to check if password was used before
userSchema.methods.isPasswordReused = function (newPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.previousPasswords || this.previousPasswords.length === 0) {
            return false;
        }
        for (const prevPassword of this.previousPasswords) {
            const isMatch = yield bcryptjs_1.default.compare(newPassword, prevPassword.password);
            if (isMatch) {
                return true;
            }
        }
        return false;
    });
};
// Instance method to add password to history
userSchema.methods.addPasswordToHistory = function (newPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 12);
        // Add to previous passwords (keep last 5)
        this.previousPasswords.push({
            password: hashedPassword,
            createdAt: new Date()
        });
        // Keep only the last 5 passwords
        if (this.previousPasswords.length > 5) {
            this.previousPasswords = this.previousPasswords.slice(-5);
        }
        // Update password creation date
        this.passwordCreated = new Date();
        return this.save();
    });
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
