import { Request, Response, NextFunction } from "express";
import User from "../models/user";

// User roles enum
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  HOTEL_OWNER = "hotel_owner",
  MODERATOR = "moderator"
}

// Permission levels
export enum Permission {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  ADMIN = "admin"
}

// Resource types
export enum Resource {
  HOTEL = "hotel",
  BOOKING = "booking",
  USER = "user",
  SYSTEM = "system"
}

// Permission matrix
const PERMISSIONS: Record<UserRole, Record<Resource, Permission[]>> = {
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
export const hasPermission = (userRole: UserRole, resource: Resource, permission: Permission): boolean => {
  const userPermissions = PERMISSIONS[userRole]?.[resource] || [];
  return userPermissions.includes(permission) || userPermissions.includes(Permission.ADMIN);
};

// Role-based authorization middleware
export const requireRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required"
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found"
        });
      }

      // Add user role to request for later use
      (req as any).userRole = user.role || UserRole.USER;

      if (!roles.includes((req as any).userRole)) {
        return res.status(403).json({
          status: "error",
          message: "Insufficient permissions"
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        status: "error",
        message: "Authorization check failed"
      });
    }
  };
};

// Resource-based authorization middleware
export const requirePermission = (resource: Resource, permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required"
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found"
        });
      }

      const userRole = user.role || UserRole.USER;
      const method = req.method as keyof typeof METHOD_PERMISSIONS;
      const requiredPermission = METHOD_PERMISSIONS[method] || Permission.READ;

      if (!hasPermission(userRole as UserRole, resource, requiredPermission)) {
        return res.status(403).json({
          status: "error",
          message: "Insufficient permissions for this operation"
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Permission check failed"
      });
    }
  };
};

// Owner-based authorization (users can only access their own resources)
export const requireOwnership = (resourceType: 'hotel' | 'booking' | 'user') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required"
        });
      }

      const user = await User.findById(req.userId);
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
          const hotel = await Hotel.findById(resourceId);
          isOwner = hotel && hotel.userId === req.userId;
          break;
          
        case 'booking':
          const HotelForBooking = require('../models/hotel').default;
          const hotelWithBooking = await HotelForBooking.findOne({
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
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Ownership check failed"
      });
    }
  };
};

// Method access control middleware
export const requireMethod = (methods: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!methods.includes(req.method)) {
      return res.status(405).json({
        status: "error",
        message: `Method ${req.method} not allowed. Allowed methods: ${methods.join(', ')}`
      });
    }
    next();
  };
};

// Rate limiting based on user role
export const roleBasedRateLimit = (userRole: UserRole) => {
  const limits = {
    [UserRole.USER]: { windowMs: 15 * 60 * 1000, max: 100 },
    [UserRole.HOTEL_OWNER]: { windowMs: 15 * 60 * 1000, max: 200 },
    [UserRole.MODERATOR]: { windowMs: 15 * 60 * 1000, max: 500 },
    [UserRole.ADMIN]: { windowMs: 15 * 60 * 1000, max: 1000 }
  };

  const limit = limits[userRole] || limits[UserRole.USER];
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // This would typically be implemented with a rate limiting library
    // For now, we'll just pass through
    next();
  };
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log the request
    console.log(`[AUDIT] ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.userId} - Action: ${action}`);
    
    // Override res.json to log responses
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      console.log(`[AUDIT] ${new Date().toISOString()} - Response: ${res.statusCode} - Duration: ${duration}ms`);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
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

// CSRF protection for state-changing operations
export const requireCSRF = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  
  // Only require CSRF for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = req.headers['x-csrf-token'] as string;
    
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