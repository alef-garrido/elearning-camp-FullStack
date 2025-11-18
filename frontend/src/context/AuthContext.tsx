import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { ApiClient } from '@/lib/api';
import { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
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
    // Run once on mount to populate user
    checkUserLoggedIn();

    // Listen for global auth state changes (login/logout). Use the
    // guarded handler to avoid re-entrant calls when a request fails
    // with 401 and the ApiClient dispatches the event.
    window.addEventListener('authStateChange', handleAuthStateChange);

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
    isLoading,
    isPublisher,
    isAdmin,
    isAuthenticated,
    logout
  }), [user, isLoading, isPublisher, isAdmin, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
