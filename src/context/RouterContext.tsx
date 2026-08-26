import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type AppRoute = 
  | '/'
  | '/signin'
  | '/signup'
  | '/orb'
  | '/discover'
  | '/board'
  | '/spaces'
  | '/connections'
  | '/messages'
  | '/my-space'
  | '/profile'
  | '/onboarding';

interface RouterContextType {
  currentPath: AppRoute;
  navigate: (to: AppRoute | string, options?: { replace?: boolean }) => void;
  isPublicRoute: boolean;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function normalizePath(rawPath: string): AppRoute {
  const path = rawPath.split('?')[0].split('#')[0].toLowerCase();
  
  if (path === '' || path === '/' || path === '/landing') return '/';
  if (path === '/signin' || path === '/login') return '/signin';
  if (path === '/signup' || path === '/register' || path === '/join') return '/signup';
  if (path === '/orb') return '/orb';
  if (path === '/discover') return '/discover';
  if (path === '/board' || path === '/explore' || path === '/spark' || path.startsWith('/spark/') || path.startsWith('/board/')) return '/board';
  if (path.startsWith('/spaces')) return '/spaces';
  if (path === '/connections' || path === '/circle') return '/connections';
  if (path === '/messages' || path === '/chat') return '/messages';
  if (path === '/my-space' || path === '/myspace' || path === '/my_space') return '/my-space';
  if (path === '/profile') return '/profile';
  if (path === '/onboarding') return '/onboarding';
  
  // Default to root
  return '/';
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [currentPath, setCurrentPath] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  const navigate = useCallback((to: AppRoute | string, options?: { replace?: boolean }) => {
    const targetRoute = normalizePath(to);
    
    if (typeof window !== 'undefined') {
      const urlToPush = to.startsWith('/') ? to : targetRoute;
      if (options?.replace) {
        window.history.replaceState({}, '', urlToPush);
      } else {
        window.history.pushState({}, '', urlToPush);
      }
    }
    
    setCurrentPath(targetRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Listen to browser forward/back buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route Guarding & Enforcement Logic
  const userId = user?.uid || user?.id;
  const onboardingCompleted = user?.onboardingCompleted;

  useEffect(() => {
    // Wait until initial auth loading has completed to avoid race conditions or redirect flashes
    if (isLoading) return;

    const publicRoutes: AppRoute[] = ['/', '/signin', '/signup'];

    // CASE 1: Signed-Out User
    if (!isAuthenticated || !userId) {
      // If signed out and trying to access any protected authenticated route or onboarding
      if (!publicRoutes.includes(currentPath)) {
        navigate('/signin', { replace: true });
      }
      return;
    }

    // CASE 2: Signed-In User with INCOMPLETE Onboarding
    if (onboardingCompleted === false) {
      // If incomplete and on public routes or any app route other than onboarding, redirect to /onboarding
      if (currentPath !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
      return;
    }

    // CASE 3: Signed-In User with COMPLETED Onboarding
    // Landing page '/' is NOT part of the authenticated platform. Redirect to /orb.
    if (currentPath === '/' || currentPath === '/signin' || currentPath === '/signup' || currentPath === '/onboarding') {
      navigate('/orb', { replace: true });
      return;
    }

    // Authenticated routes (/orb, /discover, /board, /connections, /messages, /profile) remain directly accessible.
  }, [isLoading, isAuthenticated, userId, onboardingCompleted, currentPath, navigate]);

  const isPublicRoute = currentPath === '/' || currentPath === '/signin' || currentPath === '/signup';

  return (
    <RouterContext.Provider value={{ currentPath, navigate, isPublicRoute }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
