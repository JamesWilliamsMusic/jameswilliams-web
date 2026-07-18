import { renderAndCheckA11y } from './helpers';
import LoginPage from '@/app/(auth)/login/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}));

describe('Accessibility: /login', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    // LoginPage is an async server component; resolve it before rendering
    const resolvedElement = await LoginPage({ searchParams: Promise.resolve({}) });
    await renderAndCheckA11y(resolvedElement);
  });
});
