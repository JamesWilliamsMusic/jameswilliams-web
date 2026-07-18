import { renderAndCheckA11y } from './helpers';
import ExclusivePage from '@/app/exclusive/page';
import { mockExclusivePostsFixture } from './fixtures/webiny';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/webiny/api', () => ({
  getExclusivePosts: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt }: any) => <img src={src} alt={alt} />;
});

describe('Accessibility: /exclusive', () => {
  it('has no WCAG 2.1 AA violations (unauthenticated)', async () => {
    const { cookies } = require('next/headers');
    cookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) });

    const page = await ExclusivePage({ searchParams: Promise.resolve({}) });
    await renderAndCheckA11y(page);
  });

  it('has no WCAG 2.1 AA violations (authenticated)', async () => {
    const { cookies } = require('next/headers');
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'mock-token' }),
    });

    const { getExclusivePosts } = require('@/lib/webiny/api');
    getExclusivePosts.mockResolvedValue(mockExclusivePostsFixture);

    const page = await ExclusivePage({ searchParams: Promise.resolve({}) });
    await renderAndCheckA11y(page);
  });
});
