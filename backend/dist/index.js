"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const my_hotels_1 = __importDefault(require("./routes/my-hotels"));
const hotels_1 = __importDefault(require("./routes/hotels"));
const my_bookings_1 = __importDefault(require("./routes/my-bookings"));
const security_1 = require("./middleware/security");
const authorization_1 = require("./middleware/authorization");
const session_1 = require("./middleware/session");
// Cloudinary configuration
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// MongoDB connection with security options
mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
});
const app = (0, express_1.default)();
// Apply comprehensive security middleware
(0, security_1.applySecurityMiddleware)(app);
// Session management
app.use(session_1.sessionMiddleware);
// Cookie parser with security options
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET || "your-secret-key"));
// Static files with security headers
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/dist"), {
    setHeaders: (res, path) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
    }
}));
// Audit logging for all API routes
app.use("/api", (0, authorization_1.auditLog)("API_ACCESS"));
// API routes with security
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/my-hotels", my_hotels_1.default);
app.use("/api/hotels", hotels_1.default);
app.use("/api/my-bookings", my_bookings_1.default);
// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Catch-all route for SPA
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../frontend/dist/index.html"));
});
// Security error handler
app.use(security_1.securityErrorHandler);
// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    if (error.name === "ValidationError") {
        return res.status(400).json({
            status: "error",
            message: "Validation failed",
            errors: Object.values(error.errors).map((err) => err.message)
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
