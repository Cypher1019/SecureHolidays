import mongoose from "mongoose";
import "dotenv/config";
import { seedUsers } from "./users";
import { seedHotels } from "./hotels";
import { seedBookings } from "./bookings";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error);
  }
};

const seedAll = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Connect to database
    await connectDB();
    
    // Seed in order (users first, then hotels, then bookings)
    console.log("\n📝 Seeding users...");
    const users = await seedUsers();
    
    console.log("\n🏨 Seeding hotels...");
    const hotels = await seedHotels();
    
    console.log("\n📅 Seeding bookings...");
    const bookings = await seedBookings();
    
    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Hotels: ${hotels.length}`);
    console.log(`   - Bookings: ${bookings.length} total across all hotels`);
    
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await disconnectDB();
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedAll();
}

export { seedAll, seedUsers, seedHotels, seedBookings }; 