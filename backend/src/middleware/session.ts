import session from "express-session";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-super-secret-session-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: "strict" as const
  },
  name: "booking-app-session" // Custom session name
};

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "30d";

// Session middleware
export const sessionMiddleware = session(sessionConfig);

// JWT token generation
export const generateJWT = (userId: string): string => {
  return jwt.sign(
    { userId, type: "access" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// JWT token verification
export const verifyJWT = (token: string): { userId: string; type: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

// Authentication middleware with session and JWT fallback
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First, try to get user from session
    if (req.session && (req.session as any).userId) {
      req.userId = (req.session as any).userId;
      return next();
    }

    // If session doesn't have user, try JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyJWT(token);
      
      if (decoded && decoded.type === "access") {
        req.userId = decoded.userId;
        // Store in session for future requests
        if (req.session) {
          (req.session as any).userId = decoded.userId;
        }
        return next();
      }
    }

    // If neither session nor JWT works, return unauthorized
    return res.status(401).json({
      status: "error",
      message: "Authentication required"
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      status: "error",
      message: "Authentication failed"
    });
  }
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return res.status(401).json({
      status: "error",
      message: "Session not found"
    });
  }

  if (!(req.session as any).userId) {
    return res.status(401).json({
      status: "error",
      message: "User not authenticated"
    });
  }

  next();
};

// CSRF token generation for session
export const generateCSRFToken = (req: Request): string => {
  if (!req.session) {
    throw new Error("Session not available");
  }
  
  const token = require("crypto").randomBytes(32).toString("hex");
  (req.session as any).csrfToken = token;
  return token;
};

// CSRF token validation for session
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-csrf-token"] as string;
  const sessionToken = (req.session as any)?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      status: "error",
      message: "Invalid CSRF token"
    });
  }
  
  next();
};

// Logout middleware
export const logout = (req: Request, res: Response, next: NextFunction) => {
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
  } else {
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  }
}; 