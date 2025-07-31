import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import cookieParser from "cookie-parser";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import myHotelRoutes from "./routes/my-hotels";
import hotelRoutes from "./routes/hotels";
import bookingRoutes from "./routes/my-bookings";
import { applySecurityMiddleware, securityErrorHandler } from "./middleware/security";
import { auditLog } from "./middleware/authorization";
import { sessionMiddleware, authenticateUser } from "./middleware/session";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB connection with security options
mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

const app = express();

// Apply comprehensive security middleware
applySecurityMiddleware(app);

// Session management
app.use(sessionMiddleware);

// Cookie parser with security options
app.use(cookieParser(process.env.COOKIE_SECRET || "your-secret-key"));

// Static files with security headers
app.use(express.static(path.join(__dirname, "../../frontend/dist"), {
  setHeaders: (res, path) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
  }
}));

// Audit logging for all API routes
app.use("/api", auditLog("API_ACCESS"));

// API routes with security
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-hotels", myHotelRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/my-bookings", bookingRoutes);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all route for SPA
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// Security error handler
app.use(securityErrorHandler);

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error("Global error:", error);
  
  if (error.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: Object.values(error.errors).map((err: any) => err.message)
    });
  }
  
  if (error.name === "MongoError" && error.code === 11000) {
    return res.status(400).json({
      status: "error",
      message: "Duplicate field value"
    });
  }
  
  res.status(500).json({
    status: "error",
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security middleware applied`);
  console.log(`📊 MongoDB connected`);
  console.log(`☁️  Cloudinary configured`);
});
