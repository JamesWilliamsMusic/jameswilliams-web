import type { HeroContent, TourDate, Album, MerchItem, SiteSettings } from './types';

export const mockHero: HeroContent = {
  id: 'mock-hero-1',
  title: 'JAMESWILLIAMS',
  tagline: 'A Symphony of the Pacific',
  socialHandle: '@JAMESWILLIAMSMUSIC',
  backgroundImage:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
};

export const mockTourDates: TourDate[] = [
  {
    id: 'td-1',
    date: '2025-08-12',
    city: 'Malibu',
    state: 'CA',
    venue: 'Pacific Amphitheatre',
    status: 'available',
    rsvpUrl: '#',
  },
  {
    id: 'td-2',
    date: '2025-08-19',
    city: 'Santa Barbara',
    state: 'CA',
    venue: 'Arlington Theatre',
    status: 'available',
    rsvpUrl: '#',
  },
  {
    id: 'td-3',
    date: '2025-09-03',
    city: 'San Diego',
    state: 'CA',
    venue: 'Humphreys by the Bay',
    status: 'few_left',
    rsvpUrl: '#',
  },
  {
    id: 'td-4',
    date: '2025-09-14',
    city: 'San Francisco',
    state: 'CA',
    venue: 'The Fillmore',
    status: 'available',
    rsvpUrl: '#',
  },
  {
    id: 'td-5',
    date: '2025-10-01',
    city: 'Portland',
    state: 'OR',
    venue: 'Revolution Hall',
    status: 'sold_out',
  },
  {
    id: 'td-6',
    date: '2025-10-18',
    city: 'Seattle',
    state: 'WA',
    venue: 'The Showbox',
    status: 'available',
    rsvpUrl: '#',
  },
];

export const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Golden Hour',
    year: 2025,
    trackCount: 8,
    totalDuration: '37 min',
    coverImage:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    tracks: [
      { title: 'Golden Hour', duration: '4:23' },
      { title: 'Pacific Drift', duration: '3:56' },
      { title: 'Saltwater Hymn', duration: '5:11' },
      { title: 'Malibu Twilight', duration: '4:02' },
      { title: 'Tides of Change', duration: '3:47' },
      { title: 'Amber Skies', duration: '6:15' },
      { title: 'Coastline', duration: '4:38' },
      { title: 'The Last Wave', duration: '5:30' },
    ],
  },
];

export const mockMerch: MerchItem[] = [
  {
    id: 'merch-1',
    title: 'Pacific Tee',
    price: 45,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-2',
    title: 'Coastline Cap',
    price: 35,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-3',
    title: 'Driftwood Tote',
    price: 30,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-4',
    title: 'Golden Hour Vinyl',
    price: 28,
    image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&q=80',
    shopUrl: '#',
  },
];

export const mockSiteSettings: SiteSettings = {
  id: 'settings-1',
  artistName: 'James Williams',
  copyright: '© 2026 James Williams Music. All rights reserved.',
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/jameswilliamsmusic' },
    { platform: 'spotify', url: '#' },
    { platform: 'apple_music', url: '#' },
    { platform: 'youtube', url: '#' },
    { platform: 'tiktok', url: '#' },
  ],
};
