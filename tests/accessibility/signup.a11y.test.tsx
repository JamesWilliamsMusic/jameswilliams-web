import { renderAndCheckA11y } from './helpers';
import SignupPage from '@/app/(auth)/signup/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/signup',
}));

describe('Accessibility: /signup', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    await renderAndCheckA11y(<SignupPage />);
  });
});
