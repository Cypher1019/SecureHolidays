import mongoose from "mongoose";
import Hotel from "../models/hotel";
import User from "../models/user";

const hotelTypes = ["Budget", "Business", "Luxury", "Resort", "Boutique", "Spa", "Casino", "Airport", "Extended Stay", "All-Inclusive"];
const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];
const countries = ["USA", "Canada", "UK", "France", "Germany", "Italy", "Spain", "Japan", "Australia", "Brazil"];
const facilities = [
  "Free WiFi", "Swimming Pool", "Fitness Center", "Spa", "Restaurant", "Bar", "Room Service", "Laundry", "Business Center", "Parking",
  "Air Conditioning", "Mini Bar", "Balcony", "Ocean View", "Mountain View", "Kitchen", "Pet Friendly", "Wheelchair Accessible"
];

const generateRandomFacilities = () => {
  const shuffled = facilities.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 8) + 3); // 3-10 facilities
};

const generateRandomImages = () => {
  const imageUrls = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500"
  ];
  const shuffled = imageUrls.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 5) + 2); // 2-6 images
};

const hotels = [
  {
    name: "Grand Plaza Hotel",
    city: "New York",
    country: "USA",
    description: "Luxurious 5-star hotel in the heart of Manhattan with stunning city views and world-class amenities.",
    type: "Luxury",
    adultCount: 2,
    childCount: 2,
    facilities: ["Free WiFi", "Swimming Pool", "Spa", "Restaurant", "Bar", "Room Service", "Business Center"],
    pricePerNight: 450,
    starRating: 5,
    imageUrls: generateRandomImages()
  },
  {
    name: "Oceanview Resort & Spa",
    city: "Los Angeles",
    country: "USA",
    description: "Beachfront resort offering breathtaking ocean views, spa treatments, and outdoor activities.",
    type: "Resort",
    adultCount: 4,
    childCount: 3,
    facilities: ["Free WiFi", "Swimming Pool", "Spa", "Restaurant", "Bar", "Ocean View", "Pet Friendly"],
    pricePerNight: 380,
    starRating: 4,
    imageUrls: generateRandomImages()
  },
  {
    name: "Business Express Inn",
    city: "Chicago",
    country: "USA",
    description: "Convenient business hotel near downtown with modern amenities and conference facilities.",
    type: "Business",
    adultCount: 2,
    childCount: 1,
    facilities: ["Free WiFi", "Business Center", "Restaurant", "Parking", "Air Conditioning"],
    pricePerNight: 120,
    starRating: 3,
    imageUrls: generateRandomImages()
  },
  {
    name: "Boutique Charm Hotel",
    city: "Paris",
    country: "France",
    description: "Charming boutique hotel in the historic district with personalized service and elegant decor.",
    type: "Boutique",
    adultCount: 2,
    childCount: 0,
    facilities: ["Free WiFi", "Restaurant", "Bar", "Balcony", "Kitchen"],
    pricePerNight: 280,
    starRating: 4,
    imageUrls: generateRandomImages()
  },
  {
    name: "Mountain Lodge Retreat",
    city: "Denver",
    country: "USA",
    description: "Cozy mountain lodge with stunning views, hiking trails, and rustic charm.",
    type: "Resort",
    adultCount: 6,
    childCount: 4,
    facilities: ["Free WiFi", "Swimming Pool", "Mountain View", "Restaurant", "Pet Friendly", "Kitchen"],
    pricePerNight: 220,
    starRating: 4,
    imageUrls: generateRandomImages()
  },
  {
    name: "Airport Comfort Inn",
    city: "Atlanta",
    country: "USA",
    description: "Convenient airport hotel with shuttle service, comfortable rooms, and 24/7 amenities.",
    type: "Airport",
    adultCount: 2,
    childCount: 2,
    facilities: ["Free WiFi", "Parking", "Air Conditioning", "Restaurant", "Shuttle Service"],
    pricePerNight: 95,
    starRating: 3,
    imageUrls: generateRandomImages()
  },
  {
    name: "Luxury Spa & Wellness",
    city: "Bali",
    country: "Indonesia",
    description: "Tranquil spa resort offering wellness treatments, yoga classes, and organic dining.",
    type: "Spa",
    adultCount: 2,
    childCount: 0,
    facilities: ["Free WiFi", "Spa", "Swimming Pool", "Restaurant", "Yoga Studio", "Organic Dining"],
    pricePerNight: 520,
    starRating: 5,
    imageUrls: generateRandomImages()
  },
  {
    name: "Extended Stay Suites",
    city: "Dallas",
    country: "USA",
    description: "Comfortable extended stay hotel with kitchenettes, laundry facilities, and weekly rates.",
    type: "Extended Stay",
    adultCount: 4,
    childCount: 2,
    facilities: ["Free WiFi", "Kitchen", "Laundry", "Parking", "Air Conditioning", "Weekly Rates"],
    pricePerNight: 85,
    starRating: 3,
    imageUrls: generateRandomImages()
  },
  {
    name: "Casino Royale Hotel",
    city: "Las Vegas",
    country: "USA",
    description: "Exciting casino hotel with gaming floors, entertainment shows, and luxury accommodations.",
    type: "Casino",
    adultCount: 2,
    childCount: 0,
    facilities: ["Free WiFi", "Casino", "Restaurant", "Bar", "Entertainment", "Swimming Pool"],
    pricePerNight: 180,
    starRating: 4,
    imageUrls: generateRandomImages()
  },
  {
    name: "All-Inclusive Paradise",
    city: "Cancun",
    country: "Mexico",
    description: "All-inclusive beach resort with unlimited food, drinks, activities, and entertainment.",
    type: "All-Inclusive",
    adultCount: 4,
    childCount: 3,
    facilities: ["Free WiFi", "All-Inclusive", "Swimming Pool", "Restaurant", "Bar", "Activities", "Entertainment"],
    pricePerNight: 320,
    starRating: 4,
    imageUrls: generateRandomImages()
  },
  {
    name: "Budget Traveler Inn",
    city: "Miami",
    country: "USA",
    description: "Affordable budget hotel with clean rooms, basic amenities, and great location.",
    type: "Budget",
    adultCount: 2,
    childCount: 1,
    facilities: ["Free WiFi", "Air Conditioning", "Parking", "Basic Amenities"],
    pricePerNight: 65,
    starRating: 2,
    imageUrls: generateRandomImages()
  },
  {
    name: "Historic Grand Hotel",
    city: "London",
    country: "UK",
    description: "Historic luxury hotel with classic architecture, fine dining, and traditional British service.",
    type: "Luxury",
    adultCount: 2,
    childCount: 1,
    facilities: ["Free WiFi", "Restaurant", "Bar", "Room Service", "Historic Building", "Fine Dining"],
    pricePerNight: 650,
    starRating: 5,
    imageUrls: generateRandomImages()
  }
];

export const seedHotels = async () => {
  try {
    // Clear existing hotels
    await Hotel.deleteMany({});
    
    // Get user IDs to assign to hotels
    const users = await User.find({});
    if (users.length === 0) {
      throw new Error("No users found. Please seed users first.");
    }
    
    // Create hotels with random user assignments
    const hotelsWithUsers = hotels.map((hotel, index) => ({
      ...hotel,
      userId: users[index % users.length]._id.toString(),
      lastUpdated: new Date()
    }));
    
    const createdHotels = await Hotel.insertMany(hotelsWithUsers);
    console.log(`✅ Seeded ${createdHotels.length} hotels`);
    return createdHotels;
  } catch (error) {
    console.error("❌ Error seeding hotels:", error);
    throw error;
  }
}; 