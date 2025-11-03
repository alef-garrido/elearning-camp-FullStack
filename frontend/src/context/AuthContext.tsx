import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserLoggedIn();

    window.addEventListener('authStateChange', checkUserLoggedIn);

    return () => {
      window.removeEventListener('authStateChange', checkUserLoggedIn);
    };
  }, [checkUserLoggedIn]);

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
