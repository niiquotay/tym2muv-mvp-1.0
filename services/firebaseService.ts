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
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType, isConfigValid } from '../firebase';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review, Payment, ViewRequest } from '../types';
import { MOCK_USERS, MOCK_LISTINGS, MOCK_ADS, MOCK_CHATS } from './mockData';

// --- AUTH SERVICES ---


export const loginWithEmail = async (email: string, password: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isConfigValid) {
    // Mock login
    const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    return {
      uid: mockUser.id,
      displayName: mockUser.name,
      photoURL: mockUser.avatar,
      email: email,
      providerData: [],
      role: selectedRole
    } as any;
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const agentDoc = await getDoc(doc(db, 'agents', user.uid));
    
    // If somehow a profile doesn't exist, we fall back gracefully but usually signup creates it
    if (!userDoc.exists() && !agentDoc.exists()) {
      return Object.assign(user, { isNewAccount: true, role: selectedRole });
    }
    
    const role = agentDoc.exists() ? 'Agent' : 'Tenant';
    return Object.assign(user, { isNewAccount: false, role });
  } catch (error) {
    console.error('Email Login Error:', error);
    throw error;
  }
};

export const signupWithEmail = async (email: string, password: string, name: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
  if (!isConfigValid) {
    return {
      uid: 'user-' + Date.now(),
      displayName: name || 'Mock User',
      photoURL: '',
      email: email,
      providerData: [],
      role: selectedRole
    } as any;
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    
    if (selectedRole === 'Agent') {
      const newAgent = {
        id: user.uid,
        name: name || user.displayName || 'Anonymous',
        avatar: user.photoURL || '',
        rating: 5.0,
        reviewCount: 0,
        location: '',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bio: '',
        verified: false,
        role: 'Agent' as const,
        agencyName: '',
        licenseNumber: '',
        specialization: [],
        socials: { email: user.email || '' }
      };
      await setDoc(doc(db, 'agents', user.uid), newAgent);
    } else {
      const newUser = {
        id: user.uid,
        name: name || user.displayName || 'Anonymous',
        avatar: user.photoURL || '',
        rating: 5.0,
        reviewCount: 0,
        location: '',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bio: '',
        verified: false,
        role: 'Tenant' as const,
        socials: { email: user.email || '' }
      };
      await setDoc(doc(db, 'users', user.uid), newUser);
    }
    
    return Object.assign(user, { isNewAccount: true, role: selectedRole });
  } catch (error) {
    console.error('Email Signup Error:', error);
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
    // If the user configures their Firebase console to point here, it uses that implicitly.
    // We can also pass an optional actionCodeSettings if we want to force it, but let's stick to simple
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const verifyPasswordResetCode = async (code: string) => {
  if (!isConfigValid) {
    return 'user@example.com';
  }
  try {
    return await firebaseVerifyPasswordResetCode(auth, code);
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    throw error;
  }
};

export const confirmPasswordReset = async (code: string, newPassword: string) => {
  if (!isConfigValid) {
    console.log('Mock confirm password reset for code:', code);
    return;
  }
  try {
    await firebaseConfirmPasswordReset(auth, code, newPassword);
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
};

export const setupRecaptcha = (containerId: string) => {
  if (!isConfigValid) return null;
  // @ts-ignore
  if (!window.recaptchaVerifier) {
    // @ts-ignore
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      }
    });
  }
  // @ts-ignore
  return window.recaptchaVerifier;
};

export const requestPhoneCode = async (phoneNumber: string, appVerifier: any): Promise<ConfirmationResult | null> => {
  if (!isConfigValid) {
    console.log('Mock request phone code:', phoneNumber);
    return {
      confirm: async (code: string) => {
        // Mock confirmation logic
        if (code === '000000') {
           throw new Error('Invalid code');
        }
        const mockUser = MOCK_USERS[0];
        return {
          user: {
            uid: mockUser.id,
            displayName: mockUser.name,
            photoURL: mockUser.avatar,
            phoneNumber: phoneNumber
          }
        };
      }
    } as any;
  }
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export const handlePhoneUserCreation = async (user: any, name: string, selectedRole: 'Tenant' | 'Agent' = 'Tenant') => {
    if (!isConfigValid) {
      return Object.assign(user, { role: selectedRole, isNewAccount: false });
    }
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const agentDoc = await getDoc(doc(db, 'agents', user.uid));
    
    if (!userDoc.exists() && !agentDoc.exists()) {
      if (name) {
        await updateProfile(user, { displayName: name });
      }
      
      if (selectedRole === 'Agent') {
        const newAgent = {
          id: user.uid,
          name: name || user.displayName || 'Anonymous',
          avatar: user.photoURL || '',
          rating: 5.0,
          reviewCount: 0,
          location: '',
          memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bio: '',
          verified: false,
          role: 'Agent' as const,
          agencyName: '',
          licenseNumber: '',
          specialization: [],
          socials: { phone: user.phoneNumber || '' }
        };
        await setDoc(doc(db, 'agents', user.uid), newAgent);
      } else {
        const newUser = {
          id: user.uid,
          name: name || user.displayName || 'Anonymous',
          avatar: user.photoURL || '',
          rating: 5.0,
          reviewCount: 0,
          location: '',
          memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bio: '',
          verified: false,
          role: 'Tenant' as const,
          socials: { phone: user.phoneNumber || '' }
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
      }
      return Object.assign(user, { role: selectedRole, isNewAccount: true });
    }
    const role = agentDoc.exists() ? 'Agent' : 'Tenant';
    return Object.assign(user, { role, isNewAccount: false });
}

// --- USER SERVICES ---

export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (!isConfigValid) {
    return MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
  }
  
  try {
    let userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    // Fallback to agents
    userDoc = await getDoc(doc(db, 'agents', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    return null;
  } catch (error) {
    // We expect "Missing or insufficient permissions" for anonymous users trying to read PII user profiles.
    // So we just return null rather than crashing the caller.
    console.log(`Could not fetch profile for user ${userId} maybe due to PII Firestore rules:`, error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isConfigValid) {
    console.log('Mock update user profile:', userId, updates);
    return;
  }
  
  try {
    // Determine which collection they belong to
    let collectionName = 'users';
    let docRef = doc(db, 'users', userId);
    let docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      collectionName = 'agents';
      docRef = doc(db, 'agents', userId);
      docSnap = await getDoc(docRef);
    }
    
    if (!docSnap.exists()) {
      throw new Error("User does not exist in users or agents collection");
    }

    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `user_profile/${userId}`);
  }
};

export const toggleSavedListing = async (userId: string, listingId: string, currentSaved: string[] = []): Promise<string[]> => {
  if (!isConfigValid) return currentSaved.includes(listingId) ? currentSaved.filter(id => id !== listingId) : [...currentSaved, listingId];
  
  const isCurrentlySaved = currentSaved.includes(listingId);
  const newSaved = isCurrentlySaved 
    ? currentSaved.filter(id => id !== listingId) 
    : [...currentSaved, listingId];
    
  await updateUserProfile(userId, { savedListings: newSaved });
  return newSaved;
}

// --- LISTING SERVICES ---

export const getListings = async (filters?: SearchFilters): Promise<{ listings: Listing[], total: number }> => {
  if (!isConfigValid) {
    let listings = [...MOCK_LISTINGS];
    if (filters?.categoryId) listings = listings.filter(l => l.categoryId === filters.categoryId);
    if (filters?.type) listings = listings.filter(l => l.type === filters.type);
    if (filters?.propertyType) listings = listings.filter(l => l.propertyType === filters.propertyType);
    
    // Default to only active unless specifically an admin query
    if (!filters?.isAdminQuery) {
      listings = listings.filter(l => l.status === 'active' || l.status === undefined);
    }
    
    // Country code filtering with fallback
    if (filters?.countryCode) {
      const countryListings = listings.filter(l => l.country === filters.countryCode);
      if (countryListings.length > 0) {
        listings = countryListings;
      }
      // If no listings match the country, we just fall back and show all for simulation purposes
    }
    
    if (filters?.sellerId) listings = listings.filter(l => l.sellerId === filters.sellerId);
    if (filters?.bedrooms) listings = listings.filter(l => l.bedrooms >= parseInt(filters.bedrooms as unknown as string));

    
    if (filters?.minPrice) listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
    if (filters?.maxPrice) listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
    
    if (filters?.location) {
      const searchTerms = filters.location.toLowerCase().split(' ');
      listings = listings.filter(l => {
         const matchString = `${l.title} ${l.location} ${l.description}`.toLowerCase();
         return searchTerms.some(term => matchString.includes(term));
      });
    }

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
    
    // Note: To avoid complex indices, we filter status and sort client side below

    const q = query(collection(db, 'listings'), ...constraints);
    const snapshot = await getDocs(q);
    
    let listings = snapshot.docs.map(doc => doc.data() as Listing);
    
    // Filter active by default unless specifically bypassed (e.g., admin dashboard)
    if (!filters?.isAdminQuery) {
       listings = listings.filter(l => l.status === 'active' || l.status === undefined);
    }
    
    // Implement country code fallback for firestore as well to ensure users see content
    if (filters?.countryCode) {
      if (listings.length === 0) {
        // If they filtered by country and got nothing, fetch ALL and filter out country
        const allSnapshot = await getDocs(collection(db, 'listings'));
        let allListings = allSnapshot.docs.map(doc => doc.data() as Listing);
        if (!filters?.isAdminQuery) {
          allListings = allListings.filter(l => l.status === 'active' || l.status === undefined);
        }
        listings = allListings;
      }
    }

    // Client-side filtering for more complex cases
    if (filters?.minPrice) {
      listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
    }
    if (filters?.maxPrice) {
      listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
    }
    if (filters?.location) {
      const searchTerms = filters.location.toLowerCase().split(' ');
      listings = listings.filter(l => {
         const matchString = `${l.title} ${l.location} ${l.description}`.toLowerCase();
         return searchTerms.some(term => matchString.includes(term));
      });
    }

    // Client-side sort by date descending
    listings.sort((a, b) => {
      const dateA = new Date(a.datePosted).getTime();
      const dateB = new Date(b.datePosted).getTime();
      return dateB - dateA;
    });

    // If absolutely no listings exist in the DB, fallback to mock data (for preview/demo purposes)
    if (listings.length === 0) {
      listings = [...MOCK_LISTINGS];
      if (filters?.categoryId) listings = listings.filter(l => l.categoryId === filters.categoryId);
      if (filters?.type) listings = listings.filter(l => l.type === filters.type);
      if (filters?.propertyType) listings = listings.filter(l => l.propertyType === filters.propertyType);
      
      // Default to only active unless specifically an admin query
      if (!filters?.isAdminQuery) {
        listings = listings.filter(l => l.status === 'active' || l.status === undefined);
      }
      
      // Country code filtering with fallback
      if (filters?.countryCode) {
        const countryListings = listings.filter(l => l.country === filters.countryCode);
        if (countryListings.length > 0) {
          listings = countryListings;
        }
      }
      
      if (filters?.sellerId) listings = listings.filter(l => l.sellerId === filters.sellerId);
      
      if (filters?.minPrice) listings = listings.filter(l => l.price >= parseInt(filters.minPrice!));
      if (filters?.maxPrice) listings = listings.filter(l => l.price <= parseInt(filters.maxPrice!));
      if (filters?.location) {
        const searchTerms = filters.location.toLowerCase().split(' ');
        listings = listings.filter(l => {
           const matchString = `${l.title} ${l.location} ${l.description}`.toLowerCase();
           return searchTerms.some(term => matchString.includes(term));
        });
      }
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
    // Default new listings to pending so admin can review
    const newListing = { ...listing, id: docRef.id, status: 'pending' };
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

// --- PAYMENT SERVICES ---
export const createPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
  if (!isConfigValid) {
    const id = `mock-payment-${Date.now()}`;
    console.log('Mock create payment:', id, paymentData);
    return id;
  }
  const path = 'payments';
  try {
    const docRef = doc(collection(db, 'payments'));
    const newPayment = { ...paymentData, id: docRef.id };
    await setDoc(docRef, newPayment);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  if (!isConfigValid) {
    return []; // No mock payments initially
  }
  const path = 'payments';
  try {
    const q = query(collection(db, 'payments'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Payment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};


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

// --- VIEW REQUEST SERVICES ---

export const getViewRequestsForAgent = async (agentId: string): Promise<ViewRequest[]> => {
  if (!isConfigValid) {
    return [];
  }
  const path = 'view_requests';
  try {
    const q = query(collection(db, 'view_requests'), where('agentId', '==', agentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ViewRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const updateViewRequestStatus = async (id: string, status: ViewRequest['status']) => {
  if (!isConfigValid) {
    return;
  }
  const path = `view_requests/${id}`;
  try {
    await updateDoc(doc(db, 'view_requests', id), { status });
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
