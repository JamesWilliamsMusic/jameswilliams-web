import type { SiteSettings } from '@/lib/webiny/types';

const DEFAULT_ARTIST_NAME = 'James Williams';
const DEFAULT_FAVICON = '/favicon.ico';
const MAX_TITLE_LENGTH = 60;

/**
 * Resolves the artist name from site settings, falling back to the default.
 */
export function resolveArtistName(settings: SiteSettings | null): string {
  const name = settings?.artistName?.trim();
  return name || DEFAULT_ARTIST_NAME;
}

/**
 * Resolves the favicon URL from site settings, falling back to "/favicon.ico".
 */
export function resolveFavicon(settings: SiteSettings | null): string {
  const favicon = settings?.favicon?.trim();
  return favicon || DEFAULT_FAVICON;
}

/**
 * Combines artistName and pageName into a title string, truncating pageName
 * with "…" if the combined result exceeds maxLength (default 60).
 */
export function truncateTitle(
  artistName: string,
  pageName: string,
  maxLength = MAX_TITLE_LENGTH,
): string {
  const separator = ' | ';
  const full = `${artistName}${separator}${pageName}`;
  if (full.length <= maxLength) return full;

  const available = maxLength - artistName.length - separator.length - 1; // 1 char for "…"
  if (available <= 0) return artistName.slice(0, maxLength);
  return `${artistName}${separator}${pageName.slice(0, available)}…`;
}
