import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { ApiClient } from '@/lib/api';
import { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  setUser?: (user: User | null) => void;
  isLoading: boolean;
  isPublisher: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserLoggedIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ApiClient.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setUser(null);
      // Clear token on authentication failure
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Prevent re-entrant calls caused by the ApiClient dispatching an
  // 'authStateChange' event on 401 responses. Without this guard a 401
  // during `getCurrentUser` can trigger the event which calls
  // `checkUserLoggedIn` again and create a rapid loop of requests.
  const isCheckingRef = useRef(false);

  const handleAuthStateChange = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      await checkUserLoggedIn();
    } finally {
      isCheckingRef.current = false;
    }
  }, [checkUserLoggedIn]);

  useEffect(() => {
    // Only attempt to fetch current user if we have a token stored.
    const token = localStorage.getItem('authToken');
    if (token) {
      checkUserLoggedIn();
    } else {
      // No token -> not authenticated
      setIsLoading(false);
    }

    // Listen for auth state changes (login/logout) to re-check user
    window.addEventListener('authStateChange', checkUserLoggedIn);

    return () => {
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, [checkUserLoggedIn, handleAuthStateChange]);

  const logout = useCallback(async () => {
    await ApiClient.logout();
    setUser(null);
    window.dispatchEvent(new Event('authStateChange'));
  }, []);

  const isPublisher = user?.role === 'publisher';
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  const value = useMemo(() => ({
    user,
    setUser,
    isLoading,
    isPublisher,
    isAdmin,
    isAuthenticated,
    logout
  }), [user, setUser, isLoading, isPublisher, isAdmin, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
