
import { Listing, User, Agent, Monetization, Chat, ChatMessage } from '../types';

export const MOCK_USERS: (User | Agent)[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    rating: 5.0,
    reviewCount: 10,
    location: 'Accra, Ghana',
    memberSince: 'Jan 2024',
    bio: 'System Administrator',
    verified: true,
    role: 'Admin',
    socials: { email: 'info@caliberdesk.com' }
  },
  {
    id: 'agent-1',
    name: 'Kofi Mensah',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    rating: 4.8,
    reviewCount: 45,
    location: 'Kumasi, Ghana',
    memberSince: 'Feb 2024',
    bio: 'Expert in residential properties in Kumasi.',
    verified: true,
    role: 'Agent',
    agencyName: 'Mensah Real Estate',
    socials: { email: 'kofi@example.com', phone: '+233 24 123 4567' }
  } as Agent,
  {
    id: 'agent-2',
    name: 'Sarah Okafor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 4.9,
    reviewCount: 32,
    location: 'Lagos, Nigeria',
    memberSince: 'Mar 2024',
    bio: 'Luxury apartment specialist in Victoria Island.',
    verified: true,
    role: 'Agent',
    agencyName: 'Lagos Luxury Living',
    socials: { email: 'sarah@example.com', phone: '+234 80 123 4567' }
  } as Agent
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    title: 'Modern 3 Bedroom Apartment in East Legon',
    price: 2500,
    currency: 'USD',
    location: 'East Legon, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    description: 'Beautiful modern apartment in the heart of East Legon. Features 24/7 security, swimming pool, and gym.',
    sellerId: 'agent-1',
    datePosted: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true
  },
  {
    id: 'listing-2',
    title: 'Luxury Villa with Ocean View',
    price: 850000,
    currency: 'USD',
    location: 'Victoria Island, Lagos',
    country: 'NG',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'Villa',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 4500,
    description: 'Stunning villa with panoramic ocean views. Private pool, cinema room, and smart home features.',
    sellerId: 'agent-2',
    datePosted: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true
  },
  {
    id: 'listing-3',
    title: 'Commercial Office Space in Osu',
    price: 1500,
    currency: 'GHS',
    location: 'Osu, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    categoryId: 'commercial',
    type: 'Rent',
    propertyType: 'Office',
    description: 'Prime office space in Osu. High foot traffic area, perfect for startups or small businesses.',
    sellerId: 'agent-1',
    datePosted: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false
  }
];

export const MOCK_ADS: Monetization[] = [
  {
    id: 'ad-1',
    type: 'card',
    title: 'Get Featured Today!',
    description: 'Boost your listing visibility by 10x with our featured placement.',
    cta: 'Learn More',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    link: 'https://example.com/featured',
    color: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    active: true,
    priority: 10,
    clicks: 150,
    impressions: 2500,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-2',
    type: 'banner',
    title: 'New Luxury Development in Accra',
    description: 'Pre-launch prices available for limited time.',
    cta: 'View Project',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    link: 'https://example.com/luxury-accra',
    color: '#1e293b',
    active: true,
    priority: 5,
    clicks: 45,
    impressions: 1200,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-1',
    participants: ['admin-1', 'agent-1'],
    listingId: 'listing-1',
    messages: [
      { id: 'm1', senderId: 'agent-1', text: 'Hello, is this still available?', timestamp: new Date().toISOString(), isRead: true }
    ],
    lastMessage: 'Hello, is this still available?',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0
  }
];

export const getUser = (userId: string): User | undefined => {
  return MOCK_USERS.find(u => u.id === userId);
};
