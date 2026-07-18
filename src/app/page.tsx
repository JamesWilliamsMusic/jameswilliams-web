import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TourDates from '@/components/TourDates';
import Music from '@/components/Music';
import Merch from '@/components/Merch';
import About from '@/components/About';
import Footer from '@/components/Footer';
import { getHero, getTourDates, getAlbums, getMerch, getAbout, getSiteSettings } from '@/lib/webiny/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [hero, tourDates, albums, merch, about, settings] = await Promise.all([
    getHero(),
    getTourDates(),
    getAlbums(),
    getMerch(),
    getAbout(),
    getSiteSettings(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        {hero && <Hero hero={hero} />}
        {about && <About about={about} />}
        {tourDates.length > 0 && <TourDates dates={tourDates} />}
        {albums.length > 0 && <Music albums={albums} />}
        <Merch items={merch} />
        {settings && <Footer settings={settings} />}
      </main>
    </>
  );
}
