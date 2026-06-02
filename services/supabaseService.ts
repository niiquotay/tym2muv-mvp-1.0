import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review, Payment, ViewRequest } from '../types';
import { withCache, delCache, invalidateCachePrefix, CACHE_TTL, cacheKey } from './cacheService';
import { uploadImageToCloudinary } from './imageService';
import { MOCK_LISTINGS, MOCK_USERS, MOCK_ADS, MOCK_CHATS } from './mockData';

// --- AUTH SERVICES ---
export const loginWithEmail = async (email: string, password: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isSupabaseConfigured) {
    const matchedUser = MOCK_USERS.find(u => u.socials?.email === email || (u as any).email === email);
    const mockUser = matchedUser || {
      id: 'mock-user-login',
      name: email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
      rating: 5.0,
      reviewCount: 1,
      location: 'Accra, Ghana',
      memberSince: 'Jun 2026',
      bio: 'Demo Renter/Buyer Profile',
      verified: true,
      role: selectedRole,
      socials: { email }
    };
    
    const userResult = { ...mockUser, isNewAccount: false, role: selectedRole, uid: mockUser.id, email: email };
    localStorage.setItem('caliber_mock_user', JSON.stringify(userResult));
    return userResult;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // For now, attach role
  return Object.assign(data.user, { isNewAccount: false, role: selectedRole, uid: data.user?.id });
};

export const signupWithEmail = async (email: string, password: string, name: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isSupabaseConfigured) {
    const mockUser = {
      id: `gen-user-${Date.now()}`,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      rating: 5.0,
      reviewCount: 0,
      location: 'Lagos, Nigeria',
      memberSince: 'Jun 2026',
      bio: 'Newly Registered Account Space',
      verified: true,
      role: selectedRole,
      socials: { email }
    };
    const userResult = { ...mockUser, isNewAccount: true, role: selectedRole, uid: mockUser.id, email: email };
    localStorage.setItem('caliber_mock_user', JSON.stringify(userResult));
    return userResult;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: selectedRole,
      }
    }
  });
  if (error) throw error;
  
  return Object.assign(data.user || {}, { isNewAccount: true, role: selectedRole, uid: data.user?.id });
};

export const logout = async () => {
  localStorage.removeItem('caliber_mock_user');
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
};

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  if (!isSupabaseConfigured) {
    const checkUser = () => {
      const uStr = localStorage.getItem('caliber_mock_user');
      if (uStr) {
        try {
          callback(JSON.parse(uStr));
        } catch (e) {
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    checkUser();
    // Monitor storage changes
    const handler = () => checkUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
};

export const sendPasswordResetEmail = async (email: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.auth.resetPasswordForEmail(email);
};

export const verifyPasswordResetCode = async (code: string) => {
  // Supabase handles this automatically via link, but we mock for compat
  return 'user@example.com';
};

export const confirmPasswordReset = async (code: string, newPassword: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.auth.updateUser({ password: newPassword });
};

export const loginWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    const randomUser = MOCK_USERS.find(u => u.role === 'Agent') || MOCK_USERS[1];
    localStorage.setItem('caliber_mock_user', JSON.stringify({ ...randomUser, email: 'demo_agent@tym2muv.com' }));
    window.location.href = '/';
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` }
  });
  if (error) throw error;
};

export const loginWithLinkedIn = async () => {
  if (!isSupabaseConfigured) {
    const randomUser = MOCK_USERS.find(u => u.role === 'Tenant') || MOCK_USERS[4];
    localStorage.setItem('caliber_mock_user', JSON.stringify({ ...randomUser, email: 'demo_tenant@tym2muv.com' }));
    window.location.href = '/';
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: `${window.location.origin}/` }
  });
  if (error) throw error;
};

// --- USER SERVICES ---
const mapProfileToUser = (profileData: any): User => {
  return {
    id: profileData.id,
    name: profileData.full_name || 'Unknown',
    avatar: profileData.avatar_url || 'https://ui-avatars.com/api/?name=Unknown&background=random',
    rating: profileData.rating || 0,
    reviewCount: profileData.review_count || 0,
    location: profileData.location || 'Unknown',
    memberSince: profileData.created_at || new Date().toISOString(),
    bio: profileData.bio || '',
    verified: profileData.verified || false,
    role: profileData.role || 'Customer',
    savedListings: profileData.savedListings || [],
    socials: profileData.socials || {}
  };
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user || null;
  }
  
  try {
    return await withCache(cacheKey('profile', userId), async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error || !data) return null;
      
      const savedQuery = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId);
      data.savedListings = (savedQuery.data || []).map(r => r.listing_id);

      return mapProfileToUser(data);
    }, CACHE_TTL.PROFILES);
  } catch (err) {
    console.warn("Supabase profile fetch failed, using mock profile", err);
    const user = MOCK_USERS.find(u => u.id === userId);
    return user || null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isSupabaseConfigured) {
    const userIdx = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      MOCK_USERS[userIdx] = { ...MOCK_USERS[userIdx], ...updates };
      localStorage.setItem('caliber_mock_user', JSON.stringify(MOCK_USERS[userIdx]));
    }
    return;
  }
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.full_name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  
  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    await delCache(cacheKey('profile', userId));
  }
};

export const toggleSavedListing = async (userId: string, listingId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      const saved = user.savedListings || [];
      if (saved.includes(listingId)) {
        user.savedListings = saved.filter(id => id !== listingId);
      } else {
        user.savedListings = [...saved, listingId];
      }
      localStorage.setItem('caliber_mock_user', JSON.stringify(user));
    }
    return;
  }
  
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_listings').delete().eq('id', existing.id);
  } else {
    await supabase.from('saved_listings').insert({ user_id: userId, listing_id: listingId });
  }
  await delCache(cacheKey('profile', userId)); // invalidate profile cache since savedListings changed
};

export const getSavedListingIds = async (userId: string): Promise<string[]> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user?.savedListings || [];
  }
  const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId);
  return (data || []).map(r => r.listing_id);
};

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_USERS;
  }
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProfileToUser);
  } catch (err) {
    console.warn("Supabase users fetch failed, using mock", err);
    return MOCK_USERS;
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  if (!isSupabaseConfigured) {
    const userIdx = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      MOCK_USERS[userIdx].role = role as any;
      localStorage.setItem('caliber_mock_user', JSON.stringify(MOCK_USERS[userIdx]));
    }
    return;
  }
  await supabase.from('profiles').update({ role }).eq('id', userId);
  await delCache(cacheKey('profile', userId));
};

// --- LISTING SERVICES ---
const mapPropertyToListing = (p: any): Listing => ({
  id: p.id,
  title: p.title,
  price: p.price,
  currency: p.currency,
  location: p.location,
  country: p.country_code,
  imageUrl: (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || ''),
  images: p.images || [],
  videos: p.videos || [],
  categoryId: p.category_id,
  subcategoryId: p.subcategory_id,
  isFeatured: p.is_featured,
  isPremium: p.is_premium,
  datePosted: p.created_at,
  expiryDate: p.expiry_date,
  sellerId: p.agent_id,
  description: p.description,
  status: p.status === 'approved' ? 'active' : p.status,
  type: p.listing_type,
  propertyType: p.property_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  sqft: p.sqft,
  amenities: p.amenities || [],
  furnished: p.furnished,
  parking: p.parking,
  security: p.security,
  petsAllowed: p.pets_allowed,
  yearBuilt: p.year_built,
  isVerified: p.is_verified,
  virtualTourUrl: p.virtual_tour_url,
});

/* DB_INDEXES_REQUIRED: see supabase_production_schema.sql 
-- Run this once in Supabase SQL Editor:
CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
ON properties USING GIN (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_country_code ON properties(country_code);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
*/
export const getListings = async (filters?: SearchFilters): Promise<{ listings: Listing[], total: number, hasMore: boolean }> => {
  const getMockListings = () => {
    let filtered = [...MOCK_LISTINGS];
    if (filters?.categoryId) {
      filtered = filtered.filter(l => l.categoryId === filters.categoryId);
    }
    if (filters?.type) {
      filtered = filtered.filter(l => l.type === filters.type);
    }
    if (filters?.propertyType) {
      filtered = filtered.filter(l => l.propertyType === filters.propertyType);
    }
    if (filters?.countryCode) {
      filtered = filtered.filter(l => l.country === filters.countryCode);
    }
    if (filters?.sellerId || filters?.agent_id) {
      const sellerId = filters.sellerId || filters.agent_id;
      filtered = filtered.filter(l => l.sellerId === sellerId);
    }
    if (filters?.minPrice) {
      filtered = filtered.filter(l => l.price >= parseInt(filters.minPrice!));
    }
    if (filters?.maxPrice) {
      filtered = filtered.filter(l => l.price <= parseInt(filters.maxPrice!));
    }
    if (filters?.location) {
      filtered = filtered.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    
    // Sort logic
    if (filters?.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters?.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // Default: premium/featured first, then date newer
      filtered.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || filters?.pageSize || 24;
    const from = (page - 1) * limit;
    const pageData = filtered.slice(from, from + limit);
    
    return {
      listings: pageData,
      total: filtered.length,
      hasMore: from + limit < filtered.length
    };
  };

  if (!isSupabaseConfigured) {
    return getMockListings();
  }
  
  try {
    return await withCache(cacheKey('listings', filters || 'all'), async () => {
      let query = supabase
        .from('properties')
        .select('*, seller:profiles!agent_id(*)', { count: 'exact' });

      if (!filters?.isAdminQuery) {
        query = query.eq('status', 'approved');
      } else if (filters?.status) {
        const dbStatus = filters.status === 'active' ? 'approved' : filters.status;
        query = query.eq('status', dbStatus);
      }
      
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.type) query = query.eq('listing_type', filters.type);
      if (filters?.propertyType) query = query.eq('property_type', filters.propertyType);
      if (filters?.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters?.countryCode) query = query.eq('country_code', filters.countryCode);
      if (filters?.sellerId || filters?.agent_id) query = query.eq('agent_id', filters?.sellerId || filters?.agent_id);
      if (filters?.minPrice) query = query.gte('price', parseInt(filters.minPrice));
      if (filters?.maxPrice) query = query.lte('price', parseInt(filters.maxPrice));
      if (filters?.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters?.query) query = query.ilike('title', `%${filters.query}%`);
      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      const page = filters?.page || 1;
      const limit = filters?.limit || filters?.pageSize || 50;
      
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query.order('is_premium', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      
      const totalCount = count || 0;
      const hasMore = from + limit < totalCount;
      
      return { listings: (data || []).map(mapPropertyToListing), total: totalCount, hasMore };
    }, CACHE_TTL.SEARCH);
  } catch (err) {
    console.warn("Supabase listings query failed, using mock", err);
    return getMockListings();
  }
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  if (!isSupabaseConfigured) {
    const listing = MOCK_LISTINGS.find(l => l.id === id);
    return listing || null;
  }
  
  try {
    return await withCache(cacheKey('listing', id), async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapPropertyToListing(data);
    }, CACHE_TTL.LISTINGS);
  } catch (err) {
    console.warn("Supabase getListingById failed, using mock description", err);
    const listing = MOCK_LISTINGS.find(l => l.id === id);
    return listing || null;
  }
};

export const createListing = async (listing: Omit<Listing, 'id'>): Promise<string> => {
  if (!isSupabaseConfigured) {
    const newId = `gen-listing-${Date.now()}`;
    const newListing: Listing = {
      ...listing,
      id: newId,
      datePosted: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    MOCK_LISTINGS.push(newListing);
    return newId;
  }
  
  const { data, error } = await supabase.from('properties').insert({
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    location: listing.location,
    country_code: listing.country,
    images: listing.images,
    videos: listing.videos,
    category_id: listing.categoryId,
    subcategory_id: listing.subcategoryId,
    agent_id: listing.sellerId,
    description: listing.description,
    status: listing.status === 'active' ? 'approved' : (listing.status || 'pending'),
    listing_type: listing.type,
    property_type: listing.propertyType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    amenities: listing.amenities,
    furnished: listing.furnished,
    parking: listing.parking,
    security: listing.security,
    pets_allowed: listing.petsAllowed,
    year_built: listing.yearBuilt,
    virtual_tour_url: listing.virtualTourUrl,
  }).select('id').single();
  
  if (error) throw error;
  await invalidateCachePrefix('listings');
  return data.id;
};

export const updateListing = async (id: string, updates: Partial<Listing>) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LISTINGS[idx] = { ...MOCK_LISTINGS[idx], ...updates };
    }
    return;
  }
  
  const dbUpdates: any = {};
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status === 'active' ? 'approved' : updates.status;
  }
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.bedrooms !== undefined) dbUpdates.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
  if (updates.sqft !== undefined) dbUpdates.sqft = updates.sqft;
  if (updates.furnished !== undefined) dbUpdates.furnished = updates.furnished;
  if (updates.parking !== undefined) dbUpdates.parking = updates.parking;
  if (updates.petsAllowed !== undefined) dbUpdates.pets_allowed = updates.petsAllowed;
  if (updates.virtualTourUrl !== undefined) dbUpdates.virtual_tour_url = updates.virtualTourUrl;
  if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
  
  if (Object.keys(dbUpdates).length === 0) return;
  const { error } = await supabase.from('properties').update(dbUpdates).eq('id', id);
  if (error) throw error;
  
  await invalidateCachePrefix('listings');
  await delCache(cacheKey('listing', id));
};

export const deleteListing = async (id: string) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LISTINGS.splice(idx, 1);
    }
    return;
  }
  
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
  
  await invalidateCachePrefix('listings');
  await delCache(cacheKey('listing', id));
};

// --- STORAGE SERVICES ---
export const uploadImage = async (file: File, path: string, onProgress?: (n: number) => void): Promise<string> => {
  return uploadImageToCloudinary(file, onProgress);
};

// --- CHAT SERVICES ---
const mapChatRow = (data: any): Chat => ({
  id: data.id,
  participants: data.participants,
  listingId: data.listing_id,
  messages: (data.messages || []).map((m: any) => ({
    id: m.id,
    senderId: m.sender_id,
    text: m.content,
    timestamp: m.created_at,
    isRead: m.is_read || false
  })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  lastMessage: data.last_message,
  lastMessageTime: data.last_message_time,
  unreadCount: data.unread_count || 0,
  lastSenderId: data.last_sender_id
});

export const getChats = (userId: string, callback: (chats: Chat[]) => void) => {
  let cachedChats: Chat[] = [];
  
  const fetchInitial = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*, messages(*, sender:profiles(id, full_name, avatar_url))')
      .contains('participants', [userId])
      .order('last_message_time', { ascending: false })
      .limit(50); // Add pagination limit
    cachedChats = (data || []).map(mapChatRow);
    callback(cachedChats);
  };
  
  fetchInitial();

  const channel = supabase
    .channel(`user-chats:${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chats',
      filter: `participants=cs.{${userId}}`
    }, (payload) => {
      // Only refresh the specific chat that changed
      cachedChats = cachedChats.map(c => 
        c.id === payload.new.id ? { ...c, lastMessage: payload.new.last_message, lastMessageTime: payload.new.last_message_time } : c
      );
      callback([...cachedChats]);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const mapMessage = (data: any): ChatMessage => ({
  id: data.id,
  senderId: data.sender_id,
  text: data.content,
  timestamp: data.created_at,
  isRead: data.is_read || false
});

export const fetchMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase.from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error || !data) return [];
  return data.map(mapMessage);
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content: text,
    is_read: false
  });
  if (error) throw error;
  await supabase.from('chats').update({ last_message: text, last_message_time: new Date().toISOString(), last_sender_id: senderId }).eq('id', chatId);
};

export const createChat = async (currentUserId: string, otherUserId: string, listingId?: string): Promise<string> => {
  const { data: existing } = await supabase.from('chats')
    .select('id').contains('participants', [currentUserId, otherUserId])
    .eq('listing_id', listingId || '').maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase.from('chats').insert({
    participants: [currentUserId, otherUserId],
    listing_id: listingId,
    last_message: '',
    last_message_time: new Date().toISOString(),
    unread_count: 0
  }).select('id').single();
  
  if (error) throw error;
  return data.id;
};

// --- PAYMENT SERVICES ---
export const createPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
  const { data, error } = await supabase.from('payments').insert({
    user_id: paymentData.userId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    purpose: paymentData.purpose,
    reference_id: paymentData.referenceId,
    gateway: paymentData.gateway
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    purpose: p.purpose,
    referenceId: p.reference_id,
    gateway: p.gateway,
    createdAt: p.created_at
  }));
};

// --- ADMIN SERVICES ---
export const getAdminStats = async () => {
  if (!isSupabaseConfigured) {
    return {
      totalUsers: MOCK_USERS.length,
      totalListings: MOCK_LISTINGS.length,
      totalAds: MOCK_ADS.length,
      pendingApprovals: 2,
      revenue: 45000,
      userRoles: { 
        Admin: 1, 
        Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
        Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
      },
      listingTypes: { 
        Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
        Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
      },
      adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
    };
  }

  try {
    return await withCache('admin_stats', async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) {
        console.error('Error fetching admin stats:', error);
        // fallback if rpc fails
        return {
          totalUsers: MOCK_USERS.length, totalListings: MOCK_LISTINGS.length, totalAds: MOCK_ADS.length,
          pendingApprovals: 2, revenue: 45000,
          userRoles: { 
            Admin: 1, 
            Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
            Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
          },
          listingTypes: { 
            Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
            Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
          },
          adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
        };
      }
      return data;
    }, 300); // 5 minute TTL (5 * 60)
  } catch (err) {
    console.warn("getAdminStats query failed, falling back to mock counts:", err);
    return {
      totalUsers: MOCK_USERS.length,
      totalListings: MOCK_LISTINGS.length,
      totalAds: MOCK_ADS.length,
      pendingApprovals: 2,
      revenue: 45000,
      userRoles: { 
        Admin: 1, 
        Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
        Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
      },
      listingTypes: { 
        Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
        Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
      },
      adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
    };
  }
};

// --- MONETIZATION SERVICES ---
export const getMonetizationAds = async (countryCode?: string): Promise<Monetization[]> => {
  const getMockAds = () => {
    let ads = [...MOCK_ADS];
    if (countryCode) {
      ads = ads.filter(ad => ad.countryCode === countryCode);
    }
    return ads;
  };

  if (!isSupabaseConfigured) {
    return getMockAds();
  }

  try {
    let query = supabase.from('monetization_ads').select('*').order('priority', { ascending: false });
    if (countryCode) query = query.eq('country_code', countryCode);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((ad: any) => ({
      id: ad.id,
      type: ad.type,
      title: ad.title,
      description: ad.description,
      cta: ad.cta,
      image: ad.image_url,
      link: ad.link,
      color: ad.color,
      active: ad.active,
      countryCode: ad.country_code,
      priority: ad.priority,
      clicks: ad.clicks,
      impressions: ad.impressions,
      createdAt: ad.created_at
    }));
  } catch (err) {
    console.warn("getMonetizationAds failed, using mock ads", err);
    return getMockAds();
  }
};

export const createMonetizationAd = async (ad: any): Promise<string> => {
  if (!isSupabaseConfigured) {
    const newId = `ad-gen-${Date.now()}`;
    const newAd: Monetization = {
      id: newId,
      type: ad.type,
      title: ad.title,
      description: ad.description,
      cta: ad.cta,
      image: ad.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
      link: ad.link,
      color: ad.color || 'from-orange-600 to-amber-600',
      active: ad.active !== undefined ? ad.active : true,
      countryCode: ad.countryCode,
      priority: ad.priority || 0,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    };
    MOCK_ADS.push(newAd);
    return newId;
  }

  const { data, error } = await supabase.from('monetization_ads').insert({
    type: ad.type,
    title: ad.title,
    description: ad.description,
    cta: ad.cta,
    image_url: ad.image,
    link: ad.link,
    color: ad.color,
    active: ad.active,
    country_code: ad.countryCode,
    priority: ad.priority
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

export const updateMonetizationAd = async (id: string, updates: any) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(ad => ad.id === id);
    if (idx !== -1) {
      MOCK_ADS[idx] = {
        ...MOCK_ADS[idx],
        ...updates
      };
    }
    return;
  }

  const dbUpdates: any = {};
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.cta !== undefined) dbUpdates.cta = updates.cta;
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;
  if (updates.link !== undefined) dbUpdates.link = updates.link;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;

  const { error } = await supabase.from('monetization_ads').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteMonetizationAd = async (id: string) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(ad => ad.id === id);
    if (idx !== -1) {
      MOCK_ADS.splice(idx, 1);
    }
    return;
  }

  const { error } = await supabase.from('monetization_ads').delete().eq('id', id);
  if (error) throw error;
};

export const trackAdClick = async (id: string) => {
  await supabase.rpc('increment_ad_stat', { ad_id: id, field: 'clicks' });
};

export const trackAdImpression = async (id: string) => {
  await supabase.rpc('increment_ad_stat', { ad_id: id, field: 'impressions' });
};

// --- VIEW REQUEST SERVICES ---
export const getViewRequestsForAgent = async (agentId: string): Promise<ViewRequest[]> => {
  const { data, error } = await supabase.from('view_requests').select('*').eq('agent_id', agentId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    listingId: r.listing_id,
    tenantId: r.tenant_id,
    agentId: r.agent_id,
    status: r.status,
    requestedDate: r.requested_date,
    requestedTime: r.requested_time,
    message: r.message,
    createdAt: r.created_at
  }));
};
export const updateViewRequestStatus = async (id: string, status: any) => {
  const { error } = await supabase.from('view_requests').update({ status }).eq('id', id);
  if (error) throw error;
};

export const createViewRequest = async (request: Omit<ViewRequest, 'id' | 'createdAt'>): Promise<string> => {
  const { data, error } = await supabase.from('view_requests').insert({
    listing_id: request.listingId,
    tenant_id: request.tenantId,
    agent_id: request.agentId,
    status: request.status,
    requested_date: request.requestedDate,
    requested_time: request.requestedTime,
    message: request.message
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

// --- REVIEW SERVICES ---
export const getReviewsForVendor = async (vendorId: string): Promise<Review[]> => {
  const { data, error } = await supabase.from('reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    vendorId: r.vendor_id,
    customerId: r.customer_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at
  }));
};

export const createReview = async (review: any): Promise<string> => {
  const { data, error } = await supabase.from('reviews').insert({
    vendor_id: review.vendorId,
    customer_id: review.customerId,
    rating: review.rating,
    comment: review.comment
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

