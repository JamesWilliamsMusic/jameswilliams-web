import type {
  HeroContent,
  TourDate,
  Album,
  NewRelease,
  MerchItem,
  SiteSettings,
  AboutContent,
} from '@/lib/webiny/types';
import type { ExclusivePostsResult } from '@/lib/webiny/api';

export const mockHeroFixture: HeroContent = {
  id: 'hero-fixture-1',
  title: 'JAMES WILLIAMS',
  tagline: 'New Album Out Now',
  socialHandle: '@JAMESWILLIAMS',
  backgroundImage:
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
};

export const mockTourDatesFixture: TourDate[] = [
  {
    id: 'td-fixture-1',
    date: '2025-03-15',
    city: 'Nashville',
    state: 'TN',
    venue: 'The Ryman Auditorium',
    status: 'available',
    rsvpUrl: 'https://example.com/rsvp/nashville',
  },
  {
    id: 'td-fixture-2',
    date: '2025-04-20',
    city: 'Austin',
    state: 'TX',
    venue: 'Moody Theater',
    status: 'few_left',
    rsvpUrl: 'https://example.com/rsvp/austin',
  },
  {
    id: 'td-fixture-3',
    date: '2025-05-10',
    city: 'Denver',
    state: 'CO',
    venue: 'Red Rocks Amphitheatre',
    status: 'sold_out',
  },
];

export const mockAlbumsFixture: Album[] = [
  {
    id: 'album-fixture-1',
    title: 'Midnight Drive',
    year: 2024,
    coverImage:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
    embedUrl: 'https://open.spotify.com/embed/album/placeholder1',
    tracks: [
      { title: 'Open Road', duration: '3:45' },
      { title: 'City Lights', duration: '4:12' },
      { title: 'Midnight Drive', duration: '3:58' },
    ],
  },
  {
    id: 'album-fixture-2',
    title: 'First Steps',
    year: 2022,
    coverImage:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    tracks: [
      { title: 'Begin Again', duration: '4:01' },
      { title: 'Hometown', duration: '3:30' },
    ],
  },
];

export const mockNewReleasesFixture: NewRelease[] = [
  {
    id: 'nr-fixture-1',
    title: 'Golden Hour',
    releaseDate: '2025-06-01',
    coverImage:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    embedUrl: 'https://open.spotify.com/embed/track/placeholder1',
    type: 'single',
  },
  {
    id: 'nr-fixture-2',
    title: 'Summer Sessions EP',
    releaseDate: '2025-05-15',
    coverImage:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    embedUrl: 'https://open.spotify.com/embed/album/placeholder2',
    type: 'ep',
  },
];

export const mockMerchFixture: MerchItem[] = [
  {
    id: 'merch-fixture-1',
    title: 'Tour T-Shirt 2025',
    price: 35,
    image:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: 'https://example.com/shop/tour-tshirt',
  },
  {
    id: 'merch-fixture-2',
    title: 'Signed Vinyl',
    price: 45,
    image:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: 'https://example.com/shop/signed-vinyl',
  },
  {
    id: 'merch-fixture-3',
    title: 'Logo Hoodie',
    price: 60,
    image:
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80',
    shopUrl: 'https://example.com/shop/logo-hoodie',
  },
];

export const mockSiteSettingsFixture: SiteSettings = {
  id: 'settings-fixture-1',
  artistName: 'James Williams',
  copyright: '© 2025 James Williams. All rights reserved.',
  instagramUrl: 'https://instagram.com/jameswilliams',
  spotifyUrl: 'https://open.spotify.com/artist/jameswilliams',
  appleMusicUrl: 'https://music.apple.com/artist/jameswilliams',
  youtubeUrl: 'https://youtube.com/@jameswilliams',
  tiktokUrl: 'https://tiktok.com/@jameswilliams',
};

export const mockExclusivePostsFixture: ExclusivePostsResult = {
  posts: [
    {
      id: 'exclusive-fixture-1',
      title: 'Behind the Scenes: Recording Sessions',
      slug: 'behind-the-scenes-recording-sessions',
      body: '<p>An exclusive look at how the latest album came together in the studio.</p>',
      excerpt: 'Get a behind-the-scenes look at the recording process.',
      coverImage:
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
      publishedAt: '2025-07-01T10:00:00Z',
      category: 'blog',
      isExclusive: true,
    },
    {
      id: 'exclusive-fixture-2',
      title: 'Upcoming Tour Announcement',
      slug: 'upcoming-tour-announcement',
      body: '<p>Exciting news about upcoming tour dates and special fan-only meet and greet opportunities.</p>',
      excerpt: 'Big news about what is coming next on tour.',
      coverImage:
        'https://images.unsplash.com/photo-1501386761578-0a55d7ce4f70?w=800&q=80',
      publishedAt: '2025-06-15T14:00:00Z',
      category: 'announcement',
      isExclusive: true,
    },
  ],
  total: 2,
  hasMore: false,
};

export const mockAboutFixture: AboutContent = {
  id: 'about-fixture-1',
  heading: 'About James Williams',
  body: 'James Williams is a singer-songwriter from Nashville, Tennessee. With a passion for storytelling through music, he blends country, folk, and rock influences into a sound uniquely his own.',
  image:
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
};
