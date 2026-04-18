import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import { subscribeToAuth, getUserProfile, logout as firebaseLogout } from '../services/firebaseService';
import { isConfigValid } from '../firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  setMockUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Expose a way to manually set user for mock mode
  const setMockUser = (mockUser: User | null) => {
    setUser(mockUser);
    setFirebaseUser(mockUser ? { uid: mockUser.id, email: mockUser.socials.email } as any : null);
    if (mockUser) {
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    } else {
      localStorage.removeItem('mockUser');
    }
  };

  const logout = async () => {
    if (!isConfigValid) {
      setMockUser(null);
      return;
    }
    await firebaseLogout();
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (fUser) => {
      if (!isConfigValid) {
        // In mock mode, check localStorage for persisted mock user
        const storedMockUser = localStorage.getItem('mockUser');
        if (storedMockUser) {
          try {
            const parsedUser = JSON.parse(storedMockUser);
            setUser(parsedUser);
            setFirebaseUser({ uid: parsedUser.id, email: parsedUser.socials.email } as any);
          } catch (e) {
            setUser(null);
            setFirebaseUser(null);
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
        }
        setLoading(false);
        setIsAuthReady(true);
        return;
      }

      setFirebaseUser(fUser);
      if (fUser) {
        const profile = await getUserProfile(fUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAuthReady, isAuthenticated, setMockUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
