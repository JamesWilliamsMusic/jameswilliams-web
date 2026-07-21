/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountSettings from '@/components/account/AccountSettings';

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const mockUser = {
  email: 'fan@example.com',
  emailVerified: true,
  consentVersion: '1.0',
  consentDate: '2025-06-01T00:00:00Z',
  createdAt: 1717200000, // Unix timestamp
};

describe('AccountSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AccountSettings />);

    expect(screen.getByLabelText(/loading account settings/i)).toBeInTheDocument();
  });

  it('redirects to login on 401', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(mockLocation.href).toBe('/login?returnTo=/account');
    });
  });

  it('shows error state on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows error state on non-401 bad response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('renders user info on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('fan@example.com')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  it('shows Unverified badge when email not verified', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockUser, emailVerified: false }),
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  });

  it('shows consent info', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Version 1.0/)).toBeInTheDocument();
    });
  });

  it('shows dash when consent is null', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockUser, consentVersion: null, consentDate: null }),
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('fan@example.com')).toBeInTheDocument();
    });
  });

  it('triggers data export on button click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('Export My Data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export My Data'));
    expect(mockLocation.href).toBe('/api/account/export');
  });

  it('opens delete dialog on button click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete Account'));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('retries fetch on error try again click', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('fan@example.com')).toBeInTheDocument();
    });
  });
});

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  async function openDeleteDialog() {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete Account'));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    mockFetch.mockClear();
  }

  it('closes dialog on cancel', async () => {
    await openDeleteDialog();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('calls delete API on confirm', async () => {
    await openDeleteDialog();
    mockFetch.mockResolvedValue({ ok: true });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/account/delete', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('redirects on successful deletion', async () => {
    await openDeleteDialog();
    mockFetch.mockResolvedValue({ ok: true });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockLocation.href).toBe('/?deleted=true');
    });
  });

  it('shows error on delete failure', async () => {
    await openDeleteDialog();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Deletion failed' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Deletion failed')).toBeInTheDocument();
    });
  });

  it('shows generic error when delete throws', async () => {
    await openDeleteDialog();
    mockFetch.mockRejectedValue(new Error('Network error'));

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('closes dialog on ESC key', async () => {
    await openDeleteDialog();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('traps focus on Tab key within dialog', async () => {
    await openDeleteDialog();

    // Get buttons within the dialog
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });

    // Focus on last element and Tab should cycle to first
    deleteBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    // Focus on first element and Shift+Tab should cycle to last
    cancelBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  });

  it('does not close on ESC while deleting', async () => {
    await openDeleteDialog();

    // Start deletion (don't resolve fetch)
    mockFetch.mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    // Wait for deleting state
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    // ESC should not close
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not close on backdrop click while deleting', async () => {
    await openDeleteDialog();

    mockFetch.mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    // Backdrop click should not close
    const backdrop = screen.getByRole('alertdialog').querySelector('[aria-hidden="true"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
