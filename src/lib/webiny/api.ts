import { fetchFromCMS } from './client';
import { GET_HERO, GET_TOUR_DATES, GET_ALBUMS, GET_MERCH, GET_SITE_SETTINGS } from './queries';
import type { HeroContent, TourDate, Album, MerchItem, SiteSettings } from './types';

interface ListResponse<T> {
  data: T[];
}

export async function getHero(): Promise<HeroContent | null> {
  const data = await fetchFromCMS<{ listHeroContents: ListResponse<HeroContent> }>(GET_HERO);
  return data.listHeroContents.data[0] ?? null;
}

export async function getTourDates(): Promise<TourDate[]> {
  const data = await fetchFromCMS<{ listTourDates: ListResponse<TourDate> }>(GET_TOUR_DATES);
  return data.listTourDates.data;
}

export async function getAlbums(): Promise<Album[]> {
  const data = await fetchFromCMS<{ listAlbums: ListResponse<Album> }>(GET_ALBUMS);
  return data.listAlbums.data;
}

export async function getMerch(): Promise<MerchItem[]> {
  const data = await fetchFromCMS<{ listMerchItems: ListResponse<MerchItem> }>(GET_MERCH);
  return data.listMerchItems.data;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const data = await fetchFromCMS<{ listSiteSettings: ListResponse<SiteSettings> }>(
    GET_SITE_SETTINGS,
  );
  return data.listSiteSettings.data[0] ?? null;
}
