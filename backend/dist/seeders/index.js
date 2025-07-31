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
exports.seedBookings = exports.seedHotels = exports.seedUsers = exports.seedAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv/config");
const users_1 = require("./users");
Object.defineProperty(exports, "seedUsers", { enumerable: true, get: function () { return users_1.seedUsers; } });
const hotels_1 = require("./hotels");
Object.defineProperty(exports, "seedHotels", { enumerable: true, get: function () { return hotels_1.seedHotels; } });
const bookings_1 = require("./bookings");
Object.defineProperty(exports, "seedBookings", { enumerable: true, get: function () { return bookings_1.seedBookings; } });
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
});
const disconnectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.disconnect();
        console.log("✅ Disconnected from MongoDB");
    }
    catch (error) {
        console.error("❌ Error disconnecting from MongoDB:", error);
    }
});
const seedAll = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🌱 Starting database seeding...");
        // Connect to database
        yield connectDB();
        // Seed in order (users first, then hotels, then bookings)
        console.log("\n📝 Seeding users...");
        const users = yield (0, users_1.seedUsers)();
        console.log("\n🏨 Seeding hotels...");
        const hotels = yield (0, hotels_1.seedHotels)();
        console.log("\n📅 Seeding bookings...");
        const bookings = yield (0, bookings_1.seedBookings)();
        console.log("\n🎉 Database seeding completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Hotels: ${hotels.length}`);
        console.log(`   - Bookings: ${bookings.length} total across all hotels`);
    }
    catch (error) {
        console.error("❌ Error during seeding:", error);
    }
    finally {
        yield disconnectDB();
    }
});
exports.seedAll = seedAll;
// Run seeder if this file is executed directly
if (require.main === module) {
    seedAll();
}
