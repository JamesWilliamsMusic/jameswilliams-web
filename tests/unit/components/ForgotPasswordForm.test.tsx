/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request step', () => {
    it('renders email field and submit button', () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
    });

    it('shows validation error for invalid email', async () => {
      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('shows validation error for empty email', async () => {
      render(<ForgotPasswordForm />);

      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('calls forgot-password API with valid email', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('transitions to reset step on success', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    });

    it('shows rate limit error on 429', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('shows server error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'User not found' } }),
      });

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('shows connection error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });
  });

  describe('reset step', () => {
    async function goToResetStep() {
      mockFetch.mockResolvedValue({ ok: true });
      render(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      });
      mockFetch.mockClear();
    }

    it('shows validation errors for invalid code and password', async () => {
      await goToResetStep();

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '12' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'weak' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('calls reset-password API with valid data', async () => {
      await goToResetStep();
      mockFetch.mockResolvedValue({ ok: true });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('shows success state after password reset', async () => {
      await goToResetStep();
      mockFetch.mockResolvedValue({ ok: true });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password has been reset/i)).toBeInTheDocument();
        expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
      });
    });

    it('shows rate limit error on reset 429', async () => {
      await goToResetStep();
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('shows server error on reset API failure', async () => {
      await goToResetStep();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Code expired' } }),
      });

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText('Code expired')).toBeInTheDocument();
      });
    });

    it('shows connection error on reset network failure', async () => {
      await goToResetStep();
      mockFetch.mockRejectedValue(new Error('Network error'));

      fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });
  });
});
