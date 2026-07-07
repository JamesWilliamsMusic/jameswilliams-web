export interface HeroContent {
  id: string;
  title: string;
  tagline: string;
  socialHandle: string;
  backgroundImage: string;
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
  trackCount: number;
  totalDuration: string;
  coverImage: string;
  tracks: Track[];
}

export interface MerchItem {
  id: string;
  title: string;
  price: number;
  image: string;
  shopUrl?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  id: string;
  artistName: string;
  copyright: string;
  socialLinks: SocialLink[];
}
