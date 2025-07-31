import mongoose from "mongoose";
import User from "../models/user";
import bcrypt from "bcryptjs";

const users = [
  {
    email: "john.doe@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe"
  },
  {
    email: "jane.smith@example.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Smith"
  },
  {
    email: "mike.johnson@example.com",
    password: "password123",
    firstName: "Mike",
    lastName: "Johnson"
  },
  {
    email: "sarah.wilson@example.com",
    password: "password123",
    firstName: "Sarah",
    lastName: "Wilson"
  },
  {
    email: "david.brown@example.com",
    password: "password123",
    firstName: "David",
    lastName: "Brown"
  },
  {
    email: "emma.davis@example.com",
    password: "password123",
    firstName: "Emma",
    lastName: "Davis"
  },
  {
    email: "james.miller@example.com",
    password: "password123",
    firstName: "James",
    lastName: "Miller"
  },
  {
    email: "lisa.garcia@example.com",
    password: "password123",
    firstName: "Lisa",
    lastName: "Garcia"
  },
  {
    email: "robert.rodriguez@example.com",
    password: "password123",
    firstName: "Robert",
    lastName: "Rodriguez"
  },
  {
    email: "maria.martinez@example.com",
    password: "password123",
    firstName: "Maria",
    lastName: "Martinez"
  },
  {
    email: "thomas.anderson@example.com",
    password: "password123",
    firstName: "Thomas",
    lastName: "Anderson"
  },
  {
    email: "jennifer.taylor@example.com",
    password: "password123",
    firstName: "Jennifer",
    lastName: "Taylor"
  }
];

export const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 8)
      }))
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}; 