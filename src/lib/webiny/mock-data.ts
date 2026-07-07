import type { HeroContent, TourDate, Album, MerchItem, SiteSettings } from './types';

export const mockHero: HeroContent = {
  id: 'mock-hero-1',
  title: 'LOREM IPSUM',
  tagline: 'Dolor Sit Amet Consectetur',
  socialHandle: '@PLACEHOLDER',
  backgroundImage:
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
};

export const mockTourDates: TourDate[] = [
  {
    id: 'td-1',
    date: '2025-01-15',
    city: 'Lorem',
    state: 'IP',
    venue: 'Placeholder Venue Alpha',
    status: 'available',
    rsvpUrl: '#',
  },
  {
    id: 'td-2',
    date: '2025-02-20',
    city: 'Dolor',
    state: 'SI',
    venue: 'Placeholder Venue Beta',
    status: 'available',
    rsvpUrl: '#',
  },
  {
    id: 'td-3',
    date: '2025-03-10',
    city: 'Amet',
    state: 'CO',
    venue: 'Placeholder Venue Gamma',
    status: 'few_left',
    rsvpUrl: '#',
  },
  {
    id: 'td-4',
    date: '2025-04-05',
    city: 'Consectetur',
    state: 'AD',
    venue: 'Placeholder Venue Delta',
    status: 'sold_out',
  },
];

export const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Placeholder Album',
    year: 2025,
    coverImage:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
    tracks: [
      { title: 'Lorem Ipsum', duration: '4:00' },
      { title: 'Dolor Sit', duration: '3:30' },
      { title: 'Amet Consectetur', duration: '4:15' },
      { title: 'Adipiscing Elit', duration: '3:45' },
      { title: 'Sed Do Eiusmod', duration: '4:30' },
    ],
  },
];

export const mockMerch: MerchItem[] = [
  {
    id: 'merch-1',
    title: 'Placeholder Item A',
    price: 0,
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-2',
    title: 'Placeholder Item B',
    price: 0,
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-3',
    title: 'Placeholder Item C',
    price: 0,
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: '#',
  },
  {
    id: 'merch-4',
    title: 'Placeholder Item D',
    price: 0,
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: '#',
  },
];

export const mockSiteSettings: SiteSettings = {
  id: 'settings-1',
  artistName: 'Lorem Ipsum',
  copyright: '© 2025 Placeholder. Mock data — CMS not connected.',
  instagramUrl: '#',
  spotifyUrl: '#',
  appleMusicUrl: '#',
  youtubeUrl: '#',
  tiktokUrl: '#',
};
