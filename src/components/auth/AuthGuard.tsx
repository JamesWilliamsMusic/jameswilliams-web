'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

/** User info returned by the /api/auth/me endpoint. */
export interface AuthUser {
  email: string;
  sub?: string;
}

/** Shape of the auth context exposed to consumers. */
export interface AuthContextValue {
  /** Whether the user is authenticated. `null` while the initial check is in progress. */
  isAuthenticated: boolean | null;
  /** The authenticated user's info, or null if unauthenticated/loading. */
  user: AuthUser | null;
  /** Sign out and clear session. */
  logout: () => Promise<void>;
  /** Re-check auth state (e.g. after login). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider — wraps the app and provides authentication state to all children.
 *
 * On mount it calls GET /api/auth/me to check if httpOnly cookies represent a valid session.
 * This avoids exposing tokens to JavaScript while still giving client components access to
 * authentication status and basic user info.
 *
 * Hydration mismatch is handled by initializing `isAuthenticated` as `null` (loading state)
 * and only resolving after the client-side fetch completes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });

      if (res.ok) {
        const data = await res.json();
        setUser({ email: data.email, sub: data.sub });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Network error — assume unauthenticated
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Even if the request fails, clear local state
    }

    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      user,
      logout,
      refresh: checkAuth,
    }),
    [isAuthenticated, user, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — convenience hook for consuming auth state.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
