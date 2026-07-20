export interface HeroContent {
  id: string;
  title: string;
  tagline: string;
  socialHandle: string;
  backgroundImage: string | null;
}

export interface TourDate {
  id: string;
  date: string;
  city: string;
  state: string;
  venue: string;
  status: 'available' | 'few_left' | 'sold_out';
  rsvpUrl?: string;
}

export interface Track {
  title: string;
  duration: string;
}

export interface Album {
  id: string;
  title: string;
  year: number;
  coverImage: string | null;
  embedUrl?: string;
  tracks?: Track[];
}

export interface NewRelease {
  id: string;
  title: string;
  releaseDate: string;
  coverImage: string | null;
  embedUrl: string;
  type: 'single' | 'ep' | 'album';
}

export interface MerchItem {
  id: string;
  title: string;
  price: number;
  image: string | null;
  shopUrl?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  id: string;
  artistName: string;
  favicon?: string;
  copyright: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
}

export interface AboutContent {
  id: string;
  heading: string;
  body: string;
  image: string | null;
}

export interface ExclusivePost {
  id: string;
  title: string;
  slug: string;
  body: string;              // Rich text (HTML)
  excerpt: string;           // Teaser for unauthenticated visitors
  coverImage: string | null;
  publishedAt: string;       // ISO 8601
  category: 'blog' | 'announcement';
  isExclusive: boolean;      // Always true for gated content
}
