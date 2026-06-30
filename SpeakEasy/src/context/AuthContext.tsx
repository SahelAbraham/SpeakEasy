import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<User, 'email' | 'username' | 'password'>>,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await authService.getSession();
    if (!session) {
      setUser(null);
      return;
    }
    const found = await authService.getUserById(session.userId);
    setUser(found);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const { user: loggedIn } = await authService.loginUser(
      emailOrUsername,
      password,
    );
    setUser(loggedIn);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const { user: registered } = await authService.registerUser(
        email,
        username,
        password,
      );
      setUser(registered);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logoutUser();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, 'email' | 'username' | 'password'>>) => {
      if (!user) {
        throw new Error('Not authenticated.');
      }
      const updated = await authService.updateUser(user.id, updates);
      setUser(updated);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
