import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, AuthUser, SignInParams, SignUpParams } from '../services/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (params: SignInParams) => {
    const nextUser = await authService.signIn(params);
    setUser(nextUser);
  }, []);

  const signUp = useCallback(async (params: SignUpParams) => {
    const nextUser = await authService.signUp(params);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<AuthUser>) => {
      const updatedUser = await authService.updateUser(updates);
      setUser(updatedUser);
    },
    [],
  );

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, updateUser }),
    [user, isLoading, signIn, signUp, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
