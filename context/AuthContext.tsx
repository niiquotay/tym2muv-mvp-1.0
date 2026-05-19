import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { subscribeToAuth, getUserProfile, logout as backendLogout, isConfigValid } from '../services/supabaseService';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  setMockUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Expose a way to manually set user for mock mode
  const setMockUser = (mockUser: User | null) => {
    setUser(mockUser);
    setSupabaseUser(mockUser ? { id: mockUser.id, email: mockUser.socials.email } as any : null);
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
    await backendLogout();
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (sUser) => {
      if (!isConfigValid) {
        // In mock mode, check localStorage for persisted mock user
        const storedMockUser = localStorage.getItem('mockUser');
        if (storedMockUser) {
          try {
            const parsedUser = JSON.parse(storedMockUser);
            setUser(parsedUser);
            setSupabaseUser({ id: parsedUser.id, email: parsedUser.socials.email } as any);
          } catch (e) {
            setUser(null);
            setSupabaseUser(null);
          }
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
        setLoading(false);
        setIsAuthReady(true);
        return;
      }

      setSupabaseUser(sUser);
      if (sUser) {
        const profile = await getUserProfile(sUser.id);
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
    <AuthContext.Provider value={{ user, supabaseUser, loading, isAuthReady, isAuthenticated, setMockUser, logout }}>
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
