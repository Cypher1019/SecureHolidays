# Database Seeders

This directory contains seeders for populating the database with sample data for development and testing purposes.

## Available Seeders

### 1. Users Seeder (`users.ts`)
- **Records**: 12 users
- **Data**: Realistic user profiles with hashed passwords
- **Usage**: `npm run seed:users`

### 2. Hotels Seeder (`hotels.ts`)
- **Records**: 12 hotels
- **Data**: Various hotel types (Luxury, Resort, Business, Budget, etc.)
- **Features**: 
  - Different locations (cities and countries)
  - Various price ranges ($65 - $650 per night)
  - Star ratings (2-5 stars)
  - Multiple facilities per hotel
  - Realistic images from Unsplash
- **Usage**: `npm run seed:hotels`

### 3. Bookings Seeder (`bookings.ts`)
- **Records**: 15+ bookings distributed across hotels
- **Data**: 
  - Various guest configurations (1-4 adults, 0-3 children)
  - Random check-in/check-out dates
  - Different total costs based on hotel prices
- **Usage**: `npm run seed:bookings`

## Usage

### Seed All Data
```bash
npm run seed
```
This will run all seeders in the correct order:
1. Users
2. Hotels (requires users)
3. Bookings (requires both users and hotels)

### Seed Individual Tables
```bash
# Seed only users
npm run seed:users

# Seed only hotels (requires users to exist)
npm run seed:hotels

# Seed only bookings (requires users and hotels to exist)
npm run seed:bookings
```

## Sample Data Details

### Users
- **Emails**: john.doe@example.com, jane.smith@example.com, etc.
- **Password**: All users have password "password123" (hashed)
- **Names**: Realistic first and last names

### Hotels
- **Types**: Budget, Business, Luxury, Resort, Boutique, Spa, Casino, Airport, Extended Stay, All-Inclusive
- **Locations**: Major cities in USA, UK, France, Indonesia, Mexico
- **Facilities**: WiFi, Pool, Spa, Restaurant, Bar, Business Center, etc.
- **Price Range**: $65 - $650 per night
- **Star Ratings**: 2-5 stars

### Bookings
- **Guest Counts**: 1-4 adults, 0-3 children
- **Dates**: Random future dates (next year)
- **Duration**: 1-14 days
- **Costs**: Based on hotel prices and duration

## Dependencies

The seeders have the following dependencies:
- Users must be seeded before hotels (hotels need user IDs)
- Hotels must be seeded before bookings (bookings are added to hotels)

## Environment Requirements

Make sure your `.env` file has:
- `MONGODB_CONNECTION_STRING` - Valid MongoDB connection string
- All other required environment variables for the application

## Notes

- All existing data will be cleared before seeding
- Images are from Unsplash (free to use)
- Data is realistic but fictional
- Seeders can be run multiple times safely 