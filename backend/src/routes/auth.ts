import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";
import { generateJWT, logout } from "../middleware/session";
import { registerValidation, loginValidation, handleValidationErrors } from "../middleware/validation";

const router = express.Router();

// User registration with enhanced password validation
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "User with this email already exists"
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName
      });

      await user.save();

      // Generate JWT token
      const token = generateJWT(user._id.toString());

      // Set session
      if (req.session) {
        (req.session as any).userId = user._id.toString();
      }

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        userId: user._id,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        status: "error",
        message: "Registration failed"
      });
    }
  }
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await User.findByEmail(email);
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

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // Increment failed login attempts
        await user.incLoginAttempts();
        
        return res.status(400).json({
          status: "error",
          message: "Invalid credentials"
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = generateJWT(user._id.toString());

      // Set session
      if (req.session) {
        (req.session as any).userId = user._id.toString();
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
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        status: "error",
        message: "Login failed"
      });
    }
  }
);

router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({ userId: req.userId });
});

router.post("/logout", logout);

// Change password with password history validation
router.post(
  "/change-password",
  verifyToken,
  [
    check("currentPassword", "Current password is required").notEmpty(),
    check("newPassword", "New password is required").notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found"
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
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
      const isPasswordReused = await user.isPasswordReused(newPassword);
      if (isPasswordReused) {
        return res.status(400).json({
          status: "error",
          message: "New password cannot be the same as any of your previous 5 passwords"
        });
      }

      // Add current password to history before changing
      await user.addPasswordToHistory(user.password);

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        status: "success",
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        status: "error",
        message: "Password change failed"
      });
    }
  }
);

export default router;
