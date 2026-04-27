
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
  } as Agent,
  {
    id: 'agent-3',
    name: 'Ama Serwaa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 4.7,
    reviewCount: 56,
    location: 'Accra, Ghana',
    memberSince: 'Nov 2023',
    bio: 'Finding the perfect homes for families in Accra.',
    verified: true,
    role: 'Agent',
    agencyName: 'Serwaa Homes',
    socials: { email: 'ama@example.com', phone: '+233 20 987 6543' }
  } as Agent,
  {
    id: 'tenant-1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5.0,
    reviewCount: 2,
    location: 'Accra, Ghana',
    memberSince: 'Apr 2024',
    bio: 'Looking for a cozy apartment.',
    verified: false,
    role: 'Tenant',
    socials: { email: 'john@example.com' },
    savedListings: ['listing-1', 'listing-4']
  },
  {
    id: 'tenant-2',
    name: 'Jane Smith',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    rating: 4.5,
    reviewCount: 1,
    location: 'Tema, Ghana',
    memberSince: 'May 2024',
    bio: 'Relocating for work, need a serene environment.',
    verified: true,
    role: 'Tenant',
    socials: { email: 'jane@example.com' }
  }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    title: 'Modern 3 Bedroom Apartment',
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
    description: 'Beautiful modern apartment in the heart of East Legon. Features 24/7 security, swimming pool, and gym. Close to top international schools and shopping malls.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
    ]
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
    description: 'Stunning villa with panoramic ocean views. Private pool, cinema room, and smart home features. Enjoy luxury living at its finest.',
    sellerId: 'agent-2',
    datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    ]
  },
  {
    id: 'listing-3',
    title: 'Commercial Office Space in Prime Area',
    price: 1500,
    currency: 'GHS',
    location: 'Osu, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    categoryId: 'commercial',
    type: 'Rent',
    propertyType: 'Office',
    description: 'Prime office space in Osu. High foot traffic area, perfect for startups or small businesses looking for visibility.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    ]
  },
  {
    id: 'listing-4',
    title: 'Cozy Studio Apartment',
    price: 1200,
    currency: 'GHS',
    location: 'Cantonments, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    description: 'Perfect for young professionals. This studio is fully furnished and located in a very secure neighborhood.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
    ]
  },
  {
    id: 'listing-5',
    title: 'Family House with Large Garden',
    price: 4500,
    currency: 'GHS',
    location: 'Spintex, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'House',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2500,
    description: 'Spacious family house featuring a large garden, garage, and a boys quarters. Located in a quiet part of Spintex.',
    sellerId: 'agent-3',
    datePosted: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'
    ]
  },
  {
    id: 'listing-6',
    title: 'Retail Shop Space',
    price: 3000,
    currency: 'GHS',
    location: 'Makola, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    categoryId: 'commercial',
    type: 'Rent',
    propertyType: 'Retail',
    sqft: 200,
    description: 'Highly sought-after retail space in the bustling Makola market. Guaranteed high daily foot traffic.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: false,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
    ]
  },
  {
    id: 'listing-7',
    title: 'Newly Built 2 Bedroom Apartment',
    price: 1800,
    currency: 'GHS',
    location: 'Kasoa, Central Region',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    description: 'Affordable newly built apartment in a gated community in Kasoa. Close to main road and transport links.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80'
    ]
  },
  {
    id: 'listing-8',
    title: 'Beachfront Mansion',
    price: 2500000,
    currency: 'USD',
    location: 'Lekki Phase 1, Lagos',
    country: 'NG',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'House',
    bedrooms: 6,
    bathrooms: 7,
    sqft: 8000,
    description: 'An architectural masterpiece located on the beachfront. Features a private dock, infinity pool, and helipad.',
    sellerId: 'agent-2',
    datePosted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    ]
  },
  {
    id: 'listing-9',
    title: 'Affordable Plot of Land',
    price: 45000,
    currency: 'GHS',
    location: 'Dodowa, Greater Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    categoryId: 'land',
    type: 'Sale',
    propertyType: 'Land',
    sqft: 4000,
    description: 'Registered plot of land suitable for residential development. Very peaceful area with access to water and electricity.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'
    ]
  },
  {
    id: 'listing-10',
    title: 'Executive 4 Bedroom Home',
    price: 350000,
    currency: 'USD',
    location: 'Tema Community 25',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'House',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    description: 'Executive home in the prestigious Community 25. Large driveway, modern kitchen, and beautiful landscaping.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'
    ]
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
