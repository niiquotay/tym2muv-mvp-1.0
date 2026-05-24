import { supabase } from '../supabaseClient';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review, Payment, ViewRequest } from '../types';
import { withCache, delCache, invalidateCachePrefix, CACHE_TTL, cacheKey } from './cacheService';
import { uploadImageToCloudinary } from './imageService';

// --- AUTH SERVICES ---
export const loginWithEmail = async (email: string, password: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // For now, attach role
  return Object.assign(data.user, { isNewAccount: false, role: selectedRole, uid: data.user?.id });
};

export const signupWithEmail = async (email: string, password: string, name: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
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

export const logout = () => {
  return supabase.auth.signOut();
};

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
};

export const sendPasswordResetEmail = async (email: string) => {
  await supabase.auth.resetPasswordForEmail(email);
};

export const verifyPasswordResetCode = async (code: string) => {
  // Supabase handles this automatically via link, but we mock for compat
  return 'user@example.com';
};

export const confirmPasswordReset = async (code: string, newPassword: string) => {
  await supabase.auth.updateUser({ password: newPassword });
};

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
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
  return withCache(cacheKey('profile', userId), async () => {
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
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
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
  const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId);
  return (data || []).map(r => r.listing_id);
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProfileToUser);
};

export const updateUserRole = async (userId: string, role: string) => {
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
  status: p.status,
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
  return withCache(cacheKey('listings', filters || 'all'), async () => {
    let query = supabase
      .from('properties')
      .select('*, seller:profiles!properties_agent_id_fkey(*)', { count: 'exact' });

    if (!filters?.isAdminQuery) query = query.eq('status', 'active');
    else if (filters?.status) query = query.eq('status', filters.status);
    
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
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  return withCache(cacheKey('listing', id), async () => {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapPropertyToListing(data);
  }, CACHE_TTL.LISTINGS);
};

export const createListing = async (listing: Omit<Listing, 'id'>): Promise<string> => {
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
    status: listing.status || 'pending',
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
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
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
  return withCache('admin_stats', async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
      console.error('Error fetching admin stats:', error);
      // fallback if rpc fails
      return {
        totalUsers: 0, totalListings: 0, totalAds: 0,
        pendingApprovals: 0, revenue: 0,
        userRoles: { Admin: 0, Agent: 0, Customer: 0 },
        listingTypes: { Rent: 0, Sale: 0 },
        adPerformance: { totalClicks: 0, totalImpressions: 0 }
      };
    }
    return data;
  }, 300); // 5 minute TTL (5 * 60)
};

// --- MONETIZATION SERVICES ---
export const getMonetizationAds = async (countryCode?: string): Promise<Monetization[]> => {
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
};

export const createMonetizationAd = async (ad: any): Promise<string> => {
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
  const dbUpdates: any = {};
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  const { error } = await supabase.from('monetization_ads').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteMonetizationAd = async (id: string) => {
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

