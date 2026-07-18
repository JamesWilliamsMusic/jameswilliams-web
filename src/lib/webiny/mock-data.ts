import type { HeroContent, TourDate, Album, MerchItem, SiteSettings, ExclusivePost, AboutContent } from './types';

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

export const mockExclusivePosts: ExclusivePost[] = [
  {
    id: 'exclusive-1',
    title: 'Behind the Scenes: Recording Sessions',
    slug: 'behind-the-scenes-recording-sessions',
    body: '<p>An exclusive look at how the latest album came together in the studio.</p>',
    excerpt: 'Get a behind-the-scenes look at the recording process.',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    publishedAt: '2025-07-01T10:00:00Z',
    category: 'blog',
    isExclusive: true,
  },
  {
    id: 'exclusive-2',
    title: 'Upcoming Tour Announcement',
    slug: 'upcoming-tour-announcement',
    body: '<p>Exciting news about upcoming tour dates and special fan-only meet and greet opportunities.</p>',
    excerpt: 'Big news about what is coming next on tour.',
    coverImage: 'https://images.unsplash.com/photo-1501386761578-0a55d7ce4f70?w=800&q=80',
    publishedAt: '2025-06-15T14:00:00Z',
    category: 'announcement',
    isExclusive: true,
  },
  {
    id: 'exclusive-3',
    title: 'Writing Process: How Songs Come to Life',
    slug: 'writing-process-how-songs-come-to-life',
    body: '<p>A deep dive into the songwriting process from initial idea to finished track.</p>',
    excerpt: 'Ever wondered how a song goes from idea to reality?',
    coverImage: null,
    publishedAt: '2025-05-20T09:00:00Z',
    category: 'blog',
    isExclusive: true,
  },
];

export const mockAbout: AboutContent = {
  id: 'mock-about-1',
  heading: 'About James',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  image: null,
};
