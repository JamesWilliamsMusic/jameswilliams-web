/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { HeroContent, TourDate, Album, NewRelease, MerchItem, SiteSettings, ExclusivePost, AboutContent, ContactPageContent } from '@/lib/webiny/types';

// ---------------------------------------------------------------------------
// Mock fetchFromCMS
// ---------------------------------------------------------------------------

const mockFetchFromCMS = jest.fn();
jest.mock('@/lib/webiny/client', () => ({
  fetchFromCMS: (...args: any[]) => mockFetchFromCMS(...args),
}));

// ---------------------------------------------------------------------------
// Helpers to simulate Webiny entry format
// ---------------------------------------------------------------------------

function wrapEntry<T extends { id: string }>(item: T) {
  const { id, ...values } = item;
  return { id, values };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Webiny API functions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, WEBINY_API_URL: 'https://cms.test/graphql' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getHero', () => {
    it('returns flattened hero data from CMS', async () => {
      const { getHero } = await import('@/lib/webiny/api');

      const hero: HeroContent = {
        id: 'hero-1',
        title: 'Welcome',
        tagline: 'Tagline',
        socialHandle: '@artist',
        backgroundImage: 'https://img.test/bg.jpg',
      };
      mockFetchFromCMS.mockResolvedValue({
        listHeroContents: { data: [wrapEntry(hero)] },
      });

      const result = await getHero();
      expect(result).toEqual(hero);
    });

    it('returns null when no hero entry exists', async () => {
      const { getHero } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockResolvedValue({
        listHeroContents: { data: [] },
      });

      const result = await getHero();
      expect(result).toBeNull();
    });
  });

  describe('getTourDates', () => {
    it('returns flattened tour dates array', async () => {
      const { getTourDates } = await import('@/lib/webiny/api');

      const dates: TourDate[] = [
        { id: 'td-1', date: '2025-01-01', city: 'Sydney', state: 'NSW', venue: 'Opera House', status: 'available', rsvpUrl: '#' },
      ];
      mockFetchFromCMS.mockResolvedValue({
        listTourDates: { data: dates.map(wrapEntry) },
      });

      const result = await getTourDates();
      expect(result).toEqual(dates);
    });
  });

  describe('getAlbums', () => {
    it('returns flattened albums array', async () => {
      const { getAlbums } = await import('@/lib/webiny/api');

      const albums: Album[] = [
        { id: 'a-1', title: 'Album One', year: 2024, coverImage: null },
      ];
      mockFetchFromCMS.mockResolvedValue({
        listAlbums: { data: albums.map(wrapEntry) },
      });

      const result = await getAlbums();
      expect(result).toEqual(albums);
    });
  });

  describe('getNewReleases', () => {
    it('returns flattened new releases array', async () => {
      const { getNewReleases } = await import('@/lib/webiny/api');

      const releases: NewRelease[] = [
        { id: 'nr-1', title: 'Single', releaseDate: '2025-06-01', coverImage: null, embedUrl: 'https://spotify.test', type: 'single' },
      ];
      mockFetchFromCMS.mockResolvedValue({
        listNewReleases: { data: releases.map(wrapEntry) },
      });

      const result = await getNewReleases();
      expect(result).toEqual(releases);
    });

    it('returns empty array when CMS throws', async () => {
      const { getNewReleases } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockRejectedValue(new Error('CMS error'));

      const result = await getNewReleases();
      expect(result).toEqual([]);
    });
  });

  describe('getMerch', () => {
    it('returns flattened merch items', async () => {
      const { getMerch } = await import('@/lib/webiny/api');

      const merch: MerchItem[] = [
        { id: 'm-1', title: 'T-Shirt', price: 30, image: null, shopUrl: '#' },
      ];
      mockFetchFromCMS.mockResolvedValue({
        listMerchItems: { data: merch.map(wrapEntry) },
      });

      const result = await getMerch();
      expect(result).toEqual(merch);
    });
  });

  describe('getSiteSettings', () => {
    it('returns flattened site settings', async () => {
      const { getSiteSettings } = await import('@/lib/webiny/api');

      const settings: SiteSettings = {
        id: 's-1',
        artistName: 'James Williams',
        copyright: '© 2025',
        instagramUrl: 'https://ig.test',
      };
      mockFetchFromCMS.mockResolvedValue({
        listSiteSettingsPlural: { data: [wrapEntry(settings)] },
      });

      const result = await getSiteSettings();
      expect(result).toEqual(settings);
    });

    it('returns null when no settings exist', async () => {
      const { getSiteSettings } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockResolvedValue({
        listSiteSettingsPlural: { data: [] },
      });

      const result = await getSiteSettings();
      expect(result).toBeNull();
    });
  });

  describe('getExclusivePosts', () => {
    it('returns paginated exclusive posts with metadata', async () => {
      const { getExclusivePosts } = await import('@/lib/webiny/api');

      const posts: ExclusivePost[] = [
        {
          id: 'ep-1',
          title: 'Post One',
          slug: 'post-one',
          body: '<p>Content</p>',
          excerpt: 'Excerpt',
          coverImage: null,
          publishedAt: '2025-07-01T00:00:00Z',
          category: 'blog',
          isExclusive: true,
        },
      ];
      mockFetchFromCMS.mockResolvedValue({
        listExclusivePosts: {
          data: posts.map(wrapEntry),
          meta: { totalCount: 5, hasMoreItems: true },
        },
      });

      const result = await getExclusivePosts(1, 1);
      expect(result.posts).toEqual(posts);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('getExclusivePostBySlug', () => {
    it('returns a single post by slug', async () => {
      const { getExclusivePostBySlug } = await import('@/lib/webiny/api');

      const post: ExclusivePost = {
        id: 'ep-1',
        title: 'Post One',
        slug: 'post-one',
        body: '<p>Content</p>',
        excerpt: 'Excerpt',
        coverImage: null,
        publishedAt: '2025-07-01T00:00:00Z',
        category: 'blog',
        isExclusive: true,
      };
      mockFetchFromCMS.mockResolvedValue({
        listExclusivePosts: { data: [wrapEntry(post)] },
      });

      const result = await getExclusivePostBySlug('post-one');
      expect(result).toEqual(post);
    });

    it('returns null when no post matches slug', async () => {
      const { getExclusivePostBySlug } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockResolvedValue({
        listExclusivePosts: { data: [] },
      });

      const result = await getExclusivePostBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAbout', () => {
    it('returns flattened about content', async () => {
      const { getAbout } = await import('@/lib/webiny/api');

      const about: AboutContent = {
        id: 'about-1',
        heading: 'About',
        body: 'Bio text',
        image: null,
      };
      mockFetchFromCMS.mockResolvedValue({
        listAboutContents: { data: [wrapEntry(about)] },
      });

      const result = await getAbout();
      expect(result).toEqual(about);
    });

    it('returns null when no about entry exists', async () => {
      const { getAbout } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockResolvedValue({
        listAboutContents: { data: [] },
      });

      const result = await getAbout();
      expect(result).toBeNull();
    });
  });

  describe('getContactPage', () => {
    it('returns flattened contact page content', async () => {
      const { getContactPage } = await import('@/lib/webiny/api');

      const contact: ContactPageContent = { id: 'c-1', image: 'https://img.test/contact.jpg' };
      mockFetchFromCMS.mockResolvedValue({
        listContactPageContents: { data: [wrapEntry(contact)] },
      });

      const result = await getContactPage();
      expect(result).toEqual(contact);
    });

    it('returns null when CMS throws', async () => {
      const { getContactPage } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockRejectedValue(new Error('CMS error'));

      const result = await getContactPage();
      expect(result).toBeNull();
    });

    it('returns null when no contact page entry exists', async () => {
      const { getContactPage } = await import('@/lib/webiny/api');

      mockFetchFromCMS.mockResolvedValue({
        listContactPageContents: { data: [] },
      });

      const result = await getContactPage();
      expect(result).toBeNull();
    });
  });
});
