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
exports.seedBookings = void 0;
const hotel_1 = __importDefault(require("../models/hotel"));
const user_1 = __importDefault(require("../models/user"));
const generateRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const generateRandomCheckInOut = () => {
    const checkIn = generateRandomDate(new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // Next year
    const checkOut = new Date(checkIn.getTime() + (Math.floor(Math.random() * 14) + 1) * 24 * 60 * 60 * 1000); // 1-14 days later
    return { checkIn, checkOut };
};
const bookings = [
    {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@example.com",
        adultCount: 2,
        childCount: 1,
        totalCost: 1350
    },
    {
        firstName: "Bob",
        lastName: "Williams",
        email: "bob.williams@example.com",
        adultCount: 1,
        childCount: 0,
        totalCost: 450
    },
    {
        firstName: "Carol",
        lastName: "Davis",
        email: "carol.davis@example.com",
        adultCount: 3,
        childCount: 2,
        totalCost: 2100
    },
    {
        firstName: "David",
        lastName: "Miller",
        email: "david.miller@example.com",
        adultCount: 2,
        childCount: 0,
        totalCost: 760
    },
    {
        firstName: "Emma",
        lastName: "Wilson",
        email: "emma.wilson@example.com",
        adultCount: 4,
        childCount: 3,
        totalCost: 2800
    },
    {
        firstName: "Frank",
        lastName: "Brown",
        email: "frank.brown@example.com",
        adultCount: 1,
        childCount: 1,
        totalCost: 520
    },
    {
        firstName: "Grace",
        lastName: "Taylor",
        email: "grace.taylor@example.com",
        adultCount: 2,
        childCount: 2,
        totalCost: 1200
    },
    {
        firstName: "Henry",
        lastName: "Anderson",
        email: "henry.anderson@example.com",
        adultCount: 3,
        childCount: 0,
        totalCost: 1800
    },
    {
        firstName: "Ivy",
        lastName: "Thomas",
        email: "ivy.thomas@example.com",
        adultCount: 2,
        childCount: 1,
        totalCost: 950
    },
    {
        firstName: "Jack",
        lastName: "Jackson",
        email: "jack.jackson@example.com",
        adultCount: 1,
        childCount: 0,
        totalCost: 380
    },
    {
        firstName: "Kate",
        lastName: "White",
        email: "kate.white@example.com",
        adultCount: 4,
        childCount: 2,
        totalCost: 2400
    },
    {
        firstName: "Liam",
        lastName: "Harris",
        email: "liam.harris@example.com",
        adultCount: 2,
        childCount: 3,
        totalCost: 1600
    },
    {
        firstName: "Mia",
        lastName: "Clark",
        email: "mia.clark@example.com",
        adultCount: 3,
        childCount: 1,
        totalCost: 1950
    },
    {
        firstName: "Noah",
        lastName: "Lewis",
        email: "noah.lewis@example.com",
        adultCount: 1,
        childCount: 0,
        totalCost: 420
    },
    {
        firstName: "Olivia",
        lastName: "Robinson",
        email: "olivia.robinson@example.com",
        adultCount: 2,
        childCount: 1,
        totalCost: 1100
    }
];
const seedBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get hotels and users
        const hotels = yield hotel_1.default.find({});
        const users = yield user_1.default.find({});
        if (hotels.length === 0) {
            throw new Error("No hotels found. Please seed hotels first.");
        }
        if (users.length === 0) {
            throw new Error("No users found. Please seed users first.");
        }
        // Create bookings for each hotel
        const allBookings = [];
        for (let i = 0; i < hotels.length; i++) {
            const hotel = hotels[i];
            const hotelBookings = [];
            // Add 1-3 bookings per hotel
            const numBookings = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numBookings; j++) {
                const booking = bookings[(i + j) % bookings.length];
                const { checkIn, checkOut } = generateRandomCheckInOut();
                const randomUser = users[Math.floor(Math.random() * users.length)];
                hotelBookings.push(Object.assign(Object.assign({}, booking), { userId: randomUser._id.toString(), checkIn,
                    checkOut }));
            }
            // Add bookings to hotel
            yield hotel_1.default.findByIdAndUpdate(hotel._id, { $push: { bookings: { $each: hotelBookings } } });
            allBookings.push(...hotelBookings);
        }
        console.log(`✅ Seeded ${allBookings.length} bookings across ${hotels.length} hotels`);
        return allBookings;
    }
    catch (error) {
        console.error("❌ Error seeding bookings:", error);
        throw error;
    }
});
exports.seedBookings = seedBookings;
