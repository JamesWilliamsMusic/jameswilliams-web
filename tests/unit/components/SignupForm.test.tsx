/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupForm from '@/components/auth/SignupForm';

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form fields', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty submission', async () => {
    render(<SignupForm />);

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('shows password requirements when typing', () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'a' } });

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
  });

  it('shows consent error when not accepted', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('calls signup API with valid data', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('transitions to verify step on signup success', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
  });

  it('shows rate limit error on 429', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429 });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
    });
  });

  it('shows server error on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Unable to create account.' } }),
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Unable to create account.')).toBeInTheDocument();
    });
  });

  it('shows connection error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
    });
  });

  describe('verification step', () => {
    async function goToVerifyStep() {
      mockFetch.mockResolvedValue({ ok: true });
      render(<SignupForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1!' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      });
      mockFetch.mockClear();
    }

    it('shows validation error for invalid code', async () => {
      await goToVerifyStep();

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '12' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('calls confirm-signup API with valid code', async () => {
      await goToVerifyStep();
      mockFetch.mockResolvedValue({ ok: true });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/confirm-signup', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('shows success message after verification', async () => {
      await goToVerifyStep();
      mockFetch.mockResolvedValue({ ok: true });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      });
    });

    it('shows rate limit error on verify 429', async () => {
      await goToVerifyStep();
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });
    });

    it('shows error on verify API failure', async () => {
      await goToVerifyStep();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Expired code' } }),
      });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText('Expired code')).toBeInTheDocument();
      });
    });

    it('shows connection error on verify network failure', async () => {
      await goToVerifyStep();
      mockFetch.mockRejectedValue(new Error('Network error'));

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });
  });
});
