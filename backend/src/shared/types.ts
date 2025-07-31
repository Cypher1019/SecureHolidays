export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  failedLoginAttempts?: number;
  accountLocked?: boolean;
  accountLockedUntil?: Date;
  twoFactorEnabled?: boolean;
  previousPasswords?: Array<{
    password: string;
    createdAt: Date;
  }>;
  passwordCreated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type HotelType = {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string;
  adultCount: number;
  childCount: number;
  facilities: string[];
  pricePerNight: number;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  bookings: BookingType[];
};

export type BookingType = {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};
