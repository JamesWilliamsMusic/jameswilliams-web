import { renderAndCheckA11y } from './helpers';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/forgot-password',
}));

describe('Accessibility: /forgot-password', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    await renderAndCheckA11y(<ForgotPasswordPage />);
  });
});
