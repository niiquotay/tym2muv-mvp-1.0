import { supabase } from '../supabaseClient';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review, Payment, ViewRequest } from '../types';
import { MOCK_USERS, MOCK_LISTINGS, MOCK_ADS, MOCK_CHATS } from './mockData';

// Placeholder config validation
export const isConfigValid = !!import.meta.env.VITE_SUPABASE_URL;

// --- AUTH SERVICES ---
export const loginWithEmail = async (email: string, password: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isConfigValid) {
    const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    return {
      uid: mockUser.id,
      displayName: mockUser.name,
      photoURL: mockUser.avatar,
      email: email,
      providerData: [],
      role: selectedRole,
      isNewAccount: false
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // For now, attach role
  return Object.assign(data.user, { isNewAccount: false, role: selectedRole, uid: data.user?.id });
};

export const signupWithEmail = async (email: string, password: string, name: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isConfigValid) {
    return {
      uid: 'user-' + Date.now(),
      displayName: name || 'Mock User',
      photoURL: '',
      email: email,
      providerData: [],
      role: selectedRole,
      isNewAccount: true
    };
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

export const logout = () => {
  return supabase.auth.signOut();
};

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  if (!isConfigValid) {
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  
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
  if (!isConfigValid) return MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error || !data) return null;
  return mapProfileToUser(data);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isConfigValid) return;
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.full_name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  
  // Note: Only updating fields that match profiles table structure
  // Handle socials and savedListings as needed if they exist in schema

  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('profiles').update(dbUpdates).eq('id', userId);
  }
};

export const toggleSavedListing = async (userId: string, listingId: string, currentSaved: string[] = []): Promise<string[]> => {
  const isSaved = currentSaved.includes(listingId);
  const newSaved = isSaved ? currentSaved.filter(id => id !== listingId) : [...currentSaved, listingId];
  
  try {
    if (isSaved) {
      await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
    } else {
      await supabase
        .from('saved_listings')
        .insert({ user_id: userId, listing_id: listingId });
    }
    
    // Also update user profile savedListings array
    await supabase
       .from('profiles')
       .update({ savedListings: newSaved })
       .eq('id', userId);
       
  } catch (error) {
     console.error('Error toggling saved listing in Supabase:', error);
  }
  
  return newSaved;
};

export const getAllUsers = async (): Promise<User[]> => MOCK_USERS;
export const updateUserRole = async (userId: string, role: string) => {};

// --- LISTING SERVICES ---
export const getListings = async (filters?: SearchFilters): Promise<{ listings: Listing[], total: number }> => {
  let listings = [...MOCK_LISTINGS];
  if (filters?.categoryId) listings = listings.filter(l => l.categoryId === filters.categoryId);
  if (filters?.type) listings = listings.filter(l => l.type === filters.type);
  if (filters?.propertyType) listings = listings.filter(l => l.propertyType === filters.propertyType);
  if (filters?.bedrooms) listings = listings.filter(l => l.bedrooms && l.bedrooms >= filters.bedrooms!);
  if (!filters?.isAdminQuery) listings = listings.filter(l => l.status === 'active' || l.status === undefined);
  if (filters?.countryCode) {
    const countryListings = listings.filter(l => l.country === filters.countryCode);
    if (countryListings.length > 0) listings = countryListings;
  }
  if (filters?.sellerId) listings = listings.filter(l => l.sellerId === filters.sellerId);
  if (filters?.minPrice) listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
  if (filters?.maxPrice) listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
  if (filters?.location) {
    const searchTerms = filters.location.toLowerCase().split(' ');
    listings = listings.filter(l => searchTerms.some(term => (`${l.title} ${l.location} ${l.description}`).toLowerCase().includes(term)));
  }

  const total = listings.length;
  if (filters?.page && filters?.limit) {
    const start = (filters.page - 1) * filters.limit;
    listings = listings.slice(start, start + filters.limit);
  }
  return { listings, total };
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  return MOCK_LISTINGS.find(l => l.id === id) || null;
};

export const createListing = async (listing: Omit<Listing, 'id'>): Promise<string> => {
  return `mock-listing-${Date.now()}`;
};

export const updateListing = async (id: string, updates: Partial<Listing>) => {};
export const deleteListing = async (id: string) => {};

// --- STORAGE SERVICES ---
export const uploadImage = async (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
  if (!isConfigValid) {
    // Simulate progress for mock
    if (onProgress) {
        for (let i = 10; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            onProgress(i);
        }
    }
    return URL.createObjectURL(file);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Construct the endpoint URI for Supabase Storage
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/listings/${path}`;
    
    xhr.open('POST', endpoint, true);
    
    // Set required headers for Supabase API Auth
    xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
    // You could also set Content-Type to file.type, but typically FormData works for POST, or we send file directly
    xhr.setRequestHeader('Content-Type', file.type);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Return public URL
        const publicUrl = supabase.storage.from('listings').getPublicUrl(path).data.publicUrl;
        resolve(publicUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Network Error during upload'));
    
    xhr.send(file);
  });
};

// --- CHAT SERVICES ---
export const getChats = (userId: string, callback: (chats: Chat[]) => void) => {
  callback(MOCK_CHATS.filter(c => c.participants.includes(userId)));
  return () => {};
};

const mapMessage = (data: any): ChatMessage => ({
  id: data.id,
  senderId: data.sender_id,
  text: data.content,
  timestamp: data.created_at,
  isRead: data.is_read || false
});

export const subscribeToMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      payload => callback([mapMessage(payload.new)])
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {};
export const createChat = async (currentUserId: string, otherUserId: string, listingId?: string): Promise<string> => {
  return `mock-chat-${Date.now()}`;
};

// --- PAYMENT SERVICES ---
export const createPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => `mock-payment-${Date.now()}`;
export const getUserPayments = async (userId: string): Promise<Payment[]> => [];

// --- ADMIN SERVICES ---
export const getAdminStats = async () => ({
  totalUsers: MOCK_USERS.length,
  totalListings: MOCK_LISTINGS.length,
  totalAds: MOCK_ADS.length,
  userRoles: { Admin: 1, Agent: 2, Customer: MOCK_USERS.length - 3 },
  listingTypes: { Rent: 10, Sale: 5 },
  adPerformance: { totalClicks: 100, totalImpressions: 5000 }
});

// --- MONETIZATION SERVICES ---
export const getMonetizationAds = async (countryCode?: string): Promise<Monetization[]> => MOCK_ADS;
export const createMonetizationAd = async (ad: any): Promise<string> => `mock-ad-${Date.now()}`;
export const updateMonetizationAd = async (id: string, updates: any) => {};
export const deleteMonetizationAd = async (id: string) => {};
export const trackAdClick = async (id: string) => {};
export const trackAdImpression = async (id: string) => {};

// --- VIEW REQUEST SERVICES ---
export const getViewRequestsForAgent = async (agentId: string): Promise<ViewRequest[]> => [];
export const updateViewRequestStatus = async (id: string, status: any) => {};

// --- REVIEW SERVICES ---
export const getReviewsForVendor = async (vendorId: string): Promise<Review[]> => [];
export const createReview = async (review: any): Promise<string> => `mock-review-${Date.now()}`;
