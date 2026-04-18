/**
 * Security Service
 * Provides utilities for input sanitization, secure data handling, and validation.
 */

// Simple obfuscation key - in a real app, this would be more complex and potentially rotated
const STORAGE_KEY_PREFIX = 't2m_';
const OBFUSCATION_SECRET = 'tym2muv_secure_layer_2024';

/**
 * Basic sanitization for user-provided strings to prevent XSS.
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Simple obfuscation for data stored in localStorage.
 * Note: This is NOT strong encryption, but prevents casual snooping.
 */
function obfuscate(data: string): string {
  try {
    const combined = `${OBFUSCATION_SECRET}:${data}`;
    return btoa(combined);
  } catch (e) {
    return data;
  }
}

function deobfuscate(data: string): string | null {
  try {
    const decoded = atob(data);
    if (decoded.startsWith(`${OBFUSCATION_SECRET}:`)) {
      return decoded.substring(OBFUSCATION_SECRET.length + 1);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Secure Storage Wrapper
 * Provides a consistent interface for storing data with basic obfuscation.
 */
export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      const obfuscatedValue = obfuscate(value);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, obfuscatedValue);
    } catch (e) {
      console.error('Error saving to secureStorage:', e);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const value = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      if (!value) return null;
      return deobfuscate(value);
    } catch (e) {
      console.error('Error reading from secureStorage:', e);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (e) {
      console.error('Error removing from secureStorage:', e);
    }
  },
  
  clear: () => {
    try {
      // Only clear our app's keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error clearing secureStorage:', e);
    }
  }
};

/**
 * Input Validation Utilities
 */
export const validate = {
  email: (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },
  
  password: (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true };
  },

  phone: (phone: string): boolean => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone);
  }
};

/**
 * Simple client-side rate limiter for sensitive actions.
 */
const rateLimits = new Map<string, number[]>();

export function checkRateLimit(action: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(action) || [];
  
  // Remove expired timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (validTimestamps.length >= limit) {
    return false;
  }
  
  validTimestamps.push(now);
  rateLimits.set(action, validTimestamps);
  return true;
}
