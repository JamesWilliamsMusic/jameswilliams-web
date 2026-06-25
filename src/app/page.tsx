import Hero from '@/components/Hero';
import TourDates from '@/components/TourDates';
import Music from '@/components/Music';
import Merch from '@/components/Merch';
import Footer from '@/components/Footer';
import { getHero, getTourDates, getAlbums, getMerch, getSiteSettings } from '@/lib/webiny/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [hero, tourDates, albums, merch, settings] = await Promise.all([
    getHero(),
    getTourDates(),
    getAlbums(),
    getMerch(),
    getSiteSettings(),
  ]);

  return (
    <main className="bg-black min-h-screen">
      {hero && <Hero hero={hero} />}
      {tourDates.length > 0 && <TourDates dates={tourDates} />}
      {albums.length > 0 && <Music albums={albums} />}
      {merch.length > 0 && <Merch items={merch} />}
      {settings && <Footer settings={settings} />}
    </main>
  );
}
