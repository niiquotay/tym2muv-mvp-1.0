
export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconName: string;
  subcategories: SubCategory[];
  color: string;
}

export type PropertyType = 'Apartment' | 'House' | 'Condo' | 'Land' | 'Commercial' | 'Office' | 'Retail' | 'Warehouse' | 'Villa';
export type ListingType = 'Rent' | 'Sale';

export interface Country {
  code: string;
  name: string;
  flag: string;
  flagUrl: string;
  currency: string;
  symbol: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  country: string; // Country code (e.g., 'GH', 'NG')
  imageUrl: string; // Primary thumbnail
  images?: string[]; // Array of all images
  videos?: string[]; // Array of video URLs
  categoryId: string;
  subcategoryId?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  datePosted: string;
  expiryDate: string;
  sellerId: string; // Link to a user (Agent)
  description: string;
  
  // Real Estate Specific Fields
  type: ListingType;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  amenities?: string[];
  furnished?: boolean;
  parking?: boolean;
  security?: boolean;
  petsAllowed?: boolean;
  yearBuilt?: number;
  isVerified?: boolean;
  virtualTourUrl?: string;
}

export interface SearchFilters {
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  type?: ListingType;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  countryCode?: string;
  sellerId?: string;
}

export type UserRole = 'Agent' | 'Customer' | 'Admin';

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  memberSince: string;
  bio: string;
  verified: boolean;
  role: UserRole;
  agencyName?: string; // For Agents
  socials: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  listingId?: string;
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastSenderId?: string;
}

export interface Monetization {
  id: string;
  type: 'banner' | 'popup' | 'card' | 'tall';
  title: string;
  description: string;
  cta: string;
  image: string;
  link: string;
  color: string;
  active: boolean;
  countryCode?: string;
  priority: number;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export interface Review {
  id: string;
  vendorId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
