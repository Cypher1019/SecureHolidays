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
exports.seedUsers = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Clear existing users
        yield user_1.default.deleteMany({});
        // Hash passwords and create users
        const hashedUsers = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            return (Object.assign(Object.assign({}, user), { password: yield bcryptjs_1.default.hash(user.password, 8) }));
        })));
        const createdUsers = yield user_1.default.insertMany(hashedUsers);
        console.log(`✅ Seeded ${createdUsers.length} users`);
        return createdUsers;
    }
    catch (error) {
        console.error("❌ Error seeding users:", error);
        throw error;
    }
});
exports.seedUsers = seedUsers;
