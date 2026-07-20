import { fetchFromCMS } from './client';
import {
  GET_HERO,
  GET_TOUR_DATES,
  GET_ALBUMS,
  GET_NEW_RELEASES,
  GET_MERCH,
  GET_SITE_SETTINGS,
  GET_EXCLUSIVE_POSTS,
  GET_EXCLUSIVE_POST_BY_SLUG,
  GET_ABOUT,
  GET_CONTACT_PAGE,
} from './queries';
import {
  mockHero,
  mockTourDates,
  mockAlbums,
  mockNewReleases,
  mockMerch,
  mockSiteSettings,
  mockExclusivePosts,
  mockAbout,
} from './mock-data';
import type { HeroContent, TourDate, Album, NewRelease, MerchItem, SiteSettings, ExclusivePost, AboutContent, ContactPageContent } from './types';

interface WebinyEntry<T> {
  id: string;
  values: T;
}

interface ListResponse<T> {
  data: WebinyEntry<T>[];
}

const isCMSConfigured = Boolean(process.env.WEBINY_API_URL);

function flatten<T>(entry: WebinyEntry<T>): T & { id: string } {
  return { id: entry.id, ...entry.values };
}

export async function getHero(): Promise<HeroContent | null> {
  if (!isCMSConfigured) return mockHero;
  const data = await fetchFromCMS<{ listHeroContents: ListResponse<Omit<HeroContent, 'id'>> }>(
    GET_HERO,
  );
  const entry = data.listHeroContents.data[0];
  return entry ? flatten(entry) : null;
}

export async function getTourDates(): Promise<TourDate[]> {
  if (!isCMSConfigured) return mockTourDates;
  const data = await fetchFromCMS<{ listTourDates: ListResponse<Omit<TourDate, 'id'>> }>(
    GET_TOUR_DATES,
  );
  return data.listTourDates.data.map(flatten);
}

export async function getAlbums(): Promise<Album[]> {
  if (!isCMSConfigured) return mockAlbums;
  const data = await fetchFromCMS<{ listAlbums: ListResponse<Omit<Album, 'id'>> }>(GET_ALBUMS);
  return data.listAlbums.data.map(flatten);
}

export async function getNewReleases(): Promise<NewRelease[]> {
  if (!isCMSConfigured) return mockNewReleases;
  try {
    const data = await fetchFromCMS<{ listNewReleases: ListResponse<Omit<NewRelease, 'id'>> }>(GET_NEW_RELEASES);
    return data.listNewReleases.data.map(flatten);
  } catch {
    return [];
  }
}

export async function getMerch(): Promise<MerchItem[]> {
  if (!isCMSConfigured) return mockMerch;
  const data = await fetchFromCMS<{ listMerchItems: ListResponse<Omit<MerchItem, 'id'>> }>(
    GET_MERCH,
  );
  return data.listMerchItems.data.map(flatten);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isCMSConfigured) return mockSiteSettings;
  const data = await fetchFromCMS<{
    listSiteSettingsPlural: ListResponse<Omit<SiteSettings, 'id'>>;
  }>(GET_SITE_SETTINGS);
  const entry = data.listSiteSettingsPlural.data[0];
  return entry ? flatten(entry) : null;
}

export interface ExclusivePostsResult {
  posts: ExclusivePost[];
  total: number;
  hasMore: boolean;
}

interface ListResponseWithMeta<T> {
  data: WebinyEntry<T>[];
  meta: {
    totalCount: number;
    hasMoreItems: boolean;
  };
}

export async function getExclusivePosts(page: number = 1, limit: number = 10): Promise<ExclusivePostsResult> {
  if (!isCMSConfigured) {
    const offset = (page - 1) * limit;
    const paginatedPosts = mockExclusivePosts.slice(offset, offset + limit);
    return {
      posts: paginatedPosts,
      total: mockExclusivePosts.length,
      hasMore: offset + limit < mockExclusivePosts.length,
    };
  }

  const offset = (page - 1) * limit;
  const data = await fetchFromCMS<{
    listExclusivePosts: ListResponseWithMeta<Omit<ExclusivePost, 'id'>>;
  }>(GET_EXCLUSIVE_POSTS, { limit, offset });

  return {
    posts: data.listExclusivePosts.data.map(flatten),
    total: data.listExclusivePosts.meta.totalCount,
    hasMore: data.listExclusivePosts.meta.hasMoreItems,
  };
}

export async function getExclusivePostBySlug(slug: string): Promise<ExclusivePost | null> {
  if (!isCMSConfigured) {
    return mockExclusivePosts.find((post) => post.slug === slug) ?? null;
  }

  const data = await fetchFromCMS<{
    listExclusivePosts: ListResponse<Omit<ExclusivePost, 'id'>>;
  }>(GET_EXCLUSIVE_POST_BY_SLUG, { slug });

  const entry = data.listExclusivePosts.data[0];
  return entry ? flatten(entry) : null;
}

export async function getAbout(): Promise<AboutContent | null> {
  if (!isCMSConfigured) return mockAbout;
  const data = await fetchFromCMS<{ listAboutContents: ListResponse<Omit<AboutContent, 'id'>> }>(
    GET_ABOUT,
  );
  const entry = data.listAboutContents.data[0];
  return entry ? flatten(entry) : null;
}

export async function getContactPage(): Promise<ContactPageContent | null> {
  if (!isCMSConfigured) return { id: 'mock', image: null };
  try {
    const data = await fetchFromCMS<{ listContactPageContents: ListResponse<Omit<ContactPageContent, 'id'>> }>(
      GET_CONTACT_PAGE,
    );
    const entry = data.listContactPageContents.data[0];
    return entry ? flatten(entry) : null;
  } catch {
    return null;
  }
}
