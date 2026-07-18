import { renderAndCheckA11y } from './helpers';
import HomePage from '@/app/page';
import {
  mockHeroFixture,
  mockTourDatesFixture,
  mockAlbumsFixture,
  mockNewReleasesFixture,
  mockMerchFixture,
  mockSiteSettingsFixture,
  mockAboutFixture,
} from './fixtures/webiny';
import {
  getHero,
  getTourDates,
  getAlbums,
  getNewReleases,
  getMerch,
  getAbout,
  getSiteSettings,
} from '@/lib/webiny/api';

jest.mock('@/lib/webiny/api');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

jest.mock('@/components/auth/AuthGuard', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    logout: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// jsdom does not implement IntersectionObserver; stub it for components that use it
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

describe('Accessibility: /', () => {
  beforeEach(() => {
    (getHero as jest.Mock).mockResolvedValue(mockHeroFixture);
    (getTourDates as jest.Mock).mockResolvedValue(mockTourDatesFixture);
    (getAlbums as jest.Mock).mockResolvedValue(mockAlbumsFixture);
    (getNewReleases as jest.Mock).mockResolvedValue(mockNewReleasesFixture);
    (getMerch as jest.Mock).mockResolvedValue(mockMerchFixture);
    (getAbout as jest.Mock).mockResolvedValue(mockAboutFixture);
    (getSiteSettings as jest.Mock).mockResolvedValue(mockSiteSettingsFixture);
  });

  it('has no WCAG 2.1 AA violations', async () => {
    const page = await HomePage();
    await renderAndCheckA11y(page);
  });
});
