import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password?: string) => Promise<UserProfile>;
  signUp: (name: string, email: string, password: string, avatarUrl?: string) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateUser: (updated: UserProfile) => Promise<UserProfile>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<UserProfile>;
  saveOnboardingDraft: (data: Partial<UserProfile>) => void;
  getOnboardingDraft: () => Partial<UserProfile> | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount from persistent storage
  useEffect(() => {
    try {
      const persistedUser = authService.getCurrentUser();
      setUser(persistedUser);
    } catch (err) {
      console.error('Failed to restore auth state', err);
      setUser(null);
    } finally {
      // Provide a clean micro-tick so initialization completes before guards run
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async (email: string, password?: string): Promise<UserProfile> => {
    setError(null);
    try {
      const loggedUser = await authService.signIn(email, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      const message = err?.message || 'Failed to sign in. Please verify your credentials.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(async (
    name: string,
    email: string,
    password: string,
    avatarUrl?: string
  ): Promise<UserProfile> => {
    setError(null);
    try {
      const newUser = await authService.signUp(name, email, password, avatarUrl);
      setUser(newUser);
      return newUser;
    } catch (err: any) {
      const message = err?.message || 'Failed to create account.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<UserProfile> => {
    setError(null);
    try {
      const googleUser = await authService.signInWithGoogle();
      setUser(googleUser);
      return googleUser;
    } catch (err: any) {
      const message = err?.message || 'Google sign in failed.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authService.signOut();
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const updateUser = useCallback(async (updated: UserProfile): Promise<UserProfile> => {
    const saved = await authService.saveOnboarding(updated.id, updated);
    setUser(saved);
    return saved;
  }, []);

  const completeOnboarding = useCallback(async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const current = user || authService.getCurrentUser();
    if (!current) {
      throw new Error('No user session active to complete onboarding');
    }
    const saved = await authService.saveOnboarding(current.id, {
      ...data,
      onboardingCompleted: true,
    });
    setUser(saved);
    return saved;
  }, [user]);

  const saveOnboardingDraft = useCallback((data: Partial<UserProfile>) => {
    if (user?.id) {
      authService.saveOnboardingDraft(user.id, data);
    }
  }, [user]);

  const getOnboardingDraft = useCallback((): Partial<UserProfile> | null => {
    if (user?.id) {
      return authService.getOnboardingDraft(user.id);
    }
    return null;
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUser,
    completeOnboarding,
    saveOnboardingDraft,
    getOnboardingDraft,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
