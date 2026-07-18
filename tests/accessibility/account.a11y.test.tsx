import { render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccountPage from '@/app/(protected)/account/page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/account',
}));

const mockUserData = {
  email: 'fan@example.com',
  emailVerified: true,
  consentVersion: '1.0',
  consentDate: '2025-01-15T10:00:00Z',
  createdAt: 1700000000,
};

describe('Accessibility: /account', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUserData),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = render(<AccountPage />);

    // Wait for the component to finish loading (the "Account" heading appears)
    await waitFor(() => {
      expect(container.querySelector('h1')).not.toBeNull();
    });

    const results = await axe(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });
    expect(results).toHaveNoViolations();
  });
});
