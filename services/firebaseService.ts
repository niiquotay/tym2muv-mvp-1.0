import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType, isConfigValid } from '../firebase';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review } from '../types';
import { MOCK_USERS, MOCK_LISTINGS, MOCK_ADS, MOCK_CHATS } from './mockData';

// --- AUTH SERVICES ---

export const loginWithGoogle = async () => {
  if (!isConfigValid) {
    // Mock login
    const mockUser = MOCK_USERS[0];
    return {
      uid: mockUser.id,
      displayName: mockUser.name,
      photoURL: mockUser.avatar,
      email: mockUser.socials.email,
      providerData: []
    } as any;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user profile exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const newUser: User = {
        id: user.uid,
        name: user.displayName || 'Anonymous',
        avatar: user.photoURL || '',
        rating: 5.0,
        reviewCount: 0,
        location: '',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bio: '',
        verified: false,
        role: 'Customer',
        socials: {
          email: user.email || ''
        }
      };
      await setDoc(doc(db, 'users', user.uid), newUser);
    }
    return user;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

export const logout = () => {
  if (!isConfigValid) return Promise.resolve();
  return signOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  if (!isConfigValid) {
    // Simulate initial auth state check
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const sendPasswordResetEmail = async (email: string) => {
  if (!isConfigValid) {
    console.log('Mock send password reset email to:', email);
    return;
  }
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// --- USER SERVICES ---

export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (!isConfigValid) {
    return MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
  }
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isConfigValid) {
    console.log('Mock update user profile:', userId, updates);
    return;
  }
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// --- LISTING SERVICES ---

export const getListings = async (filters?: SearchFilters): Promise<{ listings: Listing[], total: number }> => {
  if (!isConfigValid) {
    let listings = [...MOCK_LISTINGS];
    if (filters?.categoryId) listings = listings.filter(l => l.categoryId === filters.categoryId);
    if (filters?.type) listings = listings.filter(l => l.type === filters.type);
    if (filters?.propertyType) listings = listings.filter(l => l.propertyType === filters.propertyType);
    if (filters?.countryCode) listings = listings.filter(l => l.country === filters.countryCode);
    if (filters?.sellerId) listings = listings.filter(l => l.sellerId === filters.sellerId);
    
    if (filters?.minPrice) listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
    if (filters?.maxPrice) listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
    if (filters?.location) listings = listings.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));

    const total = listings.length;
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      listings = listings.slice(start, start + filters.limit);
    }
    return { listings, total };
  }
  const path = 'listings';
  try {
    const constraints: QueryConstraint[] = [];
    
    if (filters?.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
    if (filters?.type) constraints.push(where('type', '==', filters.type));
    if (filters?.propertyType) constraints.push(where('propertyType', '==', filters.propertyType));
    if (filters?.bedrooms) constraints.push(where('bedrooms', '==', filters.bedrooms));
    if (filters?.countryCode) constraints.push(where('country', '==', filters.countryCode));
    if (filters?.sellerId) constraints.push(where('sellerId', '==', filters.sellerId));
    
    constraints.push(orderBy('datePosted', 'desc'));

    const q = query(collection(db, 'listings'), ...constraints);
    const snapshot = await getDocs(q);
    
    let listings = snapshot.docs.map(doc => doc.data() as Listing);
    
    // Client-side filtering for more complex cases
    if (filters?.minPrice) {
      listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
    }
    if (filters?.maxPrice) {
      listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
    }
    if (filters?.location) {
      listings = listings.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    const total = listings.length;

    // Pagination
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      listings = listings.slice(start, start + filters.limit);
    }

    return { listings, total };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return { listings: [], total: 0 };
  }
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  if (!isConfigValid) {
    return MOCK_LISTINGS.find(l => l.id === id) || null;
  }
  const path = `listings/${id}`;
  try {
    const docRef = doc(db, 'listings', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Listing) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const createListing = async (listing: Omit<Listing, 'id'>): Promise<string> => {
  if (!isConfigValid) {
    const id = `mock-listing-${Date.now()}`;
    console.log('Mock create listing:', id, listing);
    return id;
  }
  const path = 'listings';
  try {
    const docRef = doc(collection(db, 'listings'));
    const newListing = { ...listing, id: docRef.id };
    await setDoc(docRef, newListing);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};

export const updateListing = async (id: string, updates: Partial<Listing>) => {
  if (!isConfigValid) {
    console.log('Mock update listing:', id, updates);
    return;
  }
  const path = `listings/${id}`;
  try {
    await updateDoc(doc(db, 'listings', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteListing = async (id: string) => {
  if (!isConfigValid) {
    console.log('Mock delete listing:', id);
    return;
  }
  const path = `listings/${id}`;
  try {
    await deleteDoc(doc(db, 'listings', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- STORAGE SERVICES ---

export const uploadImage = async (file: File, path: string): Promise<string> => {
  if (!isConfigValid) {
    console.log('Mock upload image:', path, file.name);
    return URL.createObjectURL(file);
  }
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading image:", error);
    if (error.message?.toLowerCase().includes('cors') || error.message?.toLowerCase().includes('origin')) {
      alert("Image upload failed due to a CORS or Origin error. This usually means your Firebase Storage bucket needs CORS configuration. Please run 'gsutil cors set cors.json gs://<your-bucket-name>' to fix this.");
    }
    throw error;
  }
};

// --- CHAT SERVICES ---

export const getChats = (userId: string, callback: (chats: Chat[]) => void) => {
  if (!isConfigValid) {
    callback(MOCK_CHATS.filter(c => c.participants.includes(userId)));
    return () => {};
  }
  const path = 'chats';
  const q = query(
    collection(db, 'chats'), 
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => doc.data() as Chat);
    callback(chats);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  if (!isConfigValid) {
    const chat = MOCK_CHATS.find(c => c.id === chatId);
    callback(chat?.messages || []);
    return () => {};
  }
  const path = `chats/${chatId}/messages`;
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  if (!isConfigValid) {
    console.log('Mock send message:', chatId, senderId, text);
    return;
  }
  const path = `chats/${chatId}/messages`;
  try {
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const timestamp = new Date().toISOString();
    const newMessage: ChatMessage = {
      id: messageRef.id,
      senderId,
      text,
      timestamp,
      isRead: false
    };
    
    await setDoc(messageRef, newMessage);
    
    // Update chat last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const createChat = async (currentUserId: string, otherUserId: string, listingId?: string): Promise<string> => {
  if (!isConfigValid) {
    const existingChat = MOCK_CHATS.find(c => 
      c.participants.includes(currentUserId) && c.participants.includes(otherUserId)
    );
    if (existingChat) return existingChat.id;
    const id = `mock-chat-${Date.now()}`;
    console.log('Mock create chat:', id, currentUserId, otherUserId);
    return id;
  }
  const path = 'chats';
  const participants = [currentUserId, otherUserId];
  try {
    // Check if chat already exists
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId)
    );
    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => {
      const data = doc.data() as Chat;
      return data.participants.includes(otherUserId);
    });
    
    if (existingChat) return existingChat.id;
    
    const chatRef = doc(collection(db, 'chats'));
    const newChat: Chat = {
      id: chatRef.id,
      participants,
      listingId,
      lastMessage: 'Started a new conversation',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
      lastSenderId: currentUserId
    };
    
    await setDoc(chatRef, newChat);
    return chatRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};

// --- ADMIN SERVICES ---

export const getAllUsers = async (): Promise<User[]> => {
  if (!isConfigValid) return MOCK_USERS;
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: 'Agent' | 'Customer' | 'Admin') => {
  if (!isConfigValid) {
    console.log('Mock update user role:', userId, role);
    return;
  }
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getAdminStats = async () => {
  if (!isConfigValid) {
    const users = MOCK_USERS;
    const listings = MOCK_LISTINGS;
    const ads = MOCK_ADS;
    return {
      totalUsers: users.length,
      totalListings: listings.length,
      totalAds: ads.length,
      userRoles: {
        Admin: users.filter(u => u.role === 'Admin').length,
        Agent: users.filter(u => u.role === 'Agent').length,
        Customer: users.filter(u => u.role === 'Customer').length,
      },
      listingTypes: {
        Rent: listings.filter(l => l.type === 'Rent').length,
        Sale: listings.filter(l => l.type === 'Sale').length,
      },
      adPerformance: {
        totalClicks: ads.reduce((acc, ad) => acc + (ad.clicks || 0), 0),
        totalImpressions: ads.reduce((acc, ad) => acc + (ad.impressions || 0), 0),
      }
    };
  }
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const listingsSnap = await getDocs(collection(db, 'listings'));
    const monetizationSnap = await getDocs(collection(db, 'monetization'));

    const users = usersSnap.docs.map(d => d.data() as User);
    const listings = listingsSnap.docs.map(d => d.data() as Listing);
    const ads = monetizationSnap.docs.map(d => d.data() as Monetization);

    return {
      totalUsers: users.length,
      totalListings: listings.length,
      totalAds: ads.length,
      userRoles: {
        Admin: users.filter(u => u.role === 'Admin').length,
        Agent: users.filter(u => u.role === 'Agent').length,
        Customer: users.filter(u => u.role === 'Customer').length,
      },
      listingTypes: {
        Rent: listings.filter(l => l.type === 'Rent').length,
        Sale: listings.filter(l => l.type === 'Sale').length,
      },
      adPerformance: {
        totalClicks: ads.reduce((acc, ad) => acc + (ad.clicks || 0), 0),
        totalImpressions: ads.reduce((acc, ad) => acc + (ad.impressions || 0), 0),
      }
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }
};

// --- MONETIZATION SERVICES ---

export const getMonetizationAds = async (countryCode?: string): Promise<Monetization[]> => {
  if (!isConfigValid) {
    let ads = [...MOCK_ADS];
    if (countryCode) {
      ads = ads.filter(ad => !ad.countryCode || ad.countryCode === countryCode);
    }
    return ads;
  }
  const path = 'monetization';
  try {
    let q = query(collection(db, 'monetization'), orderBy('priority', 'desc'));
    if (countryCode) {
      // Note: This might require a composite index if we combine with orderBy
      // For now, we'll filter client-side if needed or just use simple query
      q = query(collection(db, 'monetization'), where('active', '==', true), orderBy('priority', 'desc'));
    }
    const snapshot = await getDocs(q);
    let ads = snapshot.docs.map(doc => doc.data() as Monetization);
    
    if (countryCode) {
      ads = ads.filter(ad => !ad.countryCode || ad.countryCode === countryCode);
    }
    
    return ads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createMonetizationAd = async (ad: Omit<Monetization, 'id' | 'clicks' | 'impressions' | 'createdAt'>): Promise<string> => {
  if (!isConfigValid) {
    const id = `mock-ad-${Date.now()}`;
    console.log('Mock create ad:', id, ad);
    return id;
  }
  const path = 'monetization';
  try {
    const docRef = doc(collection(db, 'monetization'));
    const newAd: Monetization = {
      ...ad,
      id: docRef.id,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newAd);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};

export const updateMonetizationAd = async (id: string, updates: Partial<Monetization>) => {
  if (!isConfigValid) {
    console.log('Mock update ad:', id, updates);
    return;
  }
  const path = `monetization/${id}`;
  try {
    await updateDoc(doc(db, 'monetization', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteMonetizationAd = async (id: string) => {
  if (!isConfigValid) {
    console.log('Mock delete ad:', id);
    return;
  }
  const path = `monetization/${id}`;
  try {
    await deleteDoc(doc(db, 'monetization', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const trackAdClick = async (id: string) => {
  if (!isConfigValid) {
    console.log('Mock track ad click:', id);
    return;
  }
  const path = `monetization/${id}`;
  try {
    const adRef = doc(db, 'monetization', id);
    const adSnap = await getDoc(adRef);
    if (adSnap.exists()) {
      const currentClicks = adSnap.data().clicks || 0;
      await updateDoc(adRef, { clicks: currentClicks + 1 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const trackAdImpression = async (id: string) => {
  if (!isConfigValid) {
    console.log('Mock track ad impression:', id);
    return;
  }
  const path = `monetization/${id}`;
  try {
    const adRef = doc(db, 'monetization', id);
    const adSnap = await getDoc(adRef);
    if (adSnap.exists()) {
      const currentImpressions = adSnap.data().impressions || 0;
      await updateDoc(adRef, { impressions: currentImpressions + 1 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// --- REVIEW SERVICES ---

export const getReviewsForVendor = async (vendorId: string): Promise<Review[]> => {
  if (!isConfigValid) {
    return [];
  }
  const path = 'reviews';
  try {
    const q = query(
      collection(db, 'reviews'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Review);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  if (!isConfigValid) {
    const id = `mock-review-${Date.now()}`;
    console.log('Mock create review:', id, review);
    return id;
  }
  const path = 'reviews';
  try {
    const docRef = doc(collection(db, 'reviews'));
    const newReview: Review = {
      ...review,
      id: docRef.id,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newReview);

    // Update vendor rating
    const vendorRef = doc(db, 'users', review.vendorId);
    const vendorSnap = await getDoc(vendorRef);
    if (vendorSnap.exists()) {
      const vendorData = vendorSnap.data() as User;
      const currentRating = vendorData.rating || 0;
      const currentCount = vendorData.reviewCount || 0;
      
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + review.rating) / newCount;
      
      await updateDoc(vendorRef, {
        rating: newRating,
        reviewCount: newCount
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};
