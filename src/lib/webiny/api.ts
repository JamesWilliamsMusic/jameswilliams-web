import { fetchFromCMS } from './client';
import { GET_HERO, GET_TOUR_DATES, GET_ALBUMS, GET_MERCH, GET_SITE_SETTINGS } from './queries';
import { mockHero, mockTourDates, mockAlbums, mockMerch, mockSiteSettings } from './mock-data';
import type { HeroContent, TourDate, Album, MerchItem, SiteSettings } from './types';

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

export async function getMerch(): Promise<MerchItem[]> {
  if (!isCMSConfigured) return mockMerch;
  const data = await fetchFromCMS<{ listMerchItems: ListResponse<Omit<MerchItem, 'id'>> }>(
    GET_MERCH,
  );
  return data.listMerchItems.data.map(flatten);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isCMSConfigured) return mockSiteSettings;
  const data = await fetchFromCMS<{ listSiteSettings: ListResponse<Omit<SiteSettings, 'id'>> }>(
    GET_SITE_SETTINGS,
  );
  const entry = data.listSiteSettings.data[0];
  return entry ? flatten(entry) : null;
}
