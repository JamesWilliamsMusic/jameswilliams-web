/**
 * Unit tests for src/components/auth/AuthGuard.tsx
 *
 * Tests the AuthProvider context and useAuth hook:
 * - Calls /api/auth/me on mount to check auth state
 * - Provides isAuthenticated, user, and logout to consumers
 * - Handles authenticated, unauthenticated, and error states
 * - Handles hydration (starts as null/loading)
 * - logout() calls /api/auth/logout and clears state
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/components/auth/AuthGuard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Test Consumer Component
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div>
      <span data-testid="auth-status">
        {isAuthenticated === null ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <span data-testid="user-sub">{user?.sub ?? 'none'}</span>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial auth check', () => {
    it('starts in loading state (null) before fetch resolves', () => {
      // Never resolve fetch to keep in loading state
      mockFetch.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('loading');
    });

    it('sets authenticated state when /api/auth/me returns 200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'fan@example.com', sub: 'user-123' }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('fan@example.com');
      expect(screen.getByTestId('user-sub')).toHaveTextContent('user-123');
    });

    it('sets unauthenticated state when /api/auth/me returns 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Not authenticated' }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    });

    it('sets unauthenticated state on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      });
    });

    it('calls /api/auth/me with same-origin credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not authenticated' }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'same-origin' });
      });
    });
  });

  describe('logout', () => {
    it('calls /api/auth/logout and clears auth state', async () => {
      // Initial auth check succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'fan@example.com', sub: 'user-123' }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Mock the logout fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('clears state even if logout request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'fan@example.com', sub: 'user-123' }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Logout fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for this test since React will log the error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
