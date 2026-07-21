import Hero from '@/components/Hero';
import TourDates from '@/components/TourDates';
import Music from '@/components/Music';
import Merch from '@/components/Merch';
import About from '@/components/About';
import { getHero, getTourDates, getAlbums, getNewReleases, getMerch, getAbout } from '@/lib/webiny/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [hero, tourDates, albums, newReleases, merch, about] = await Promise.all([
    getHero(),
    getTourDates(),
    getAlbums(),
    getNewReleases(),
    getMerch(),
    getAbout(),
  ]);

  return (
    <main>
      {hero && <Hero hero={hero} />}
      {about && <About about={about} />}
      {tourDates.length > 0 && <TourDates dates={tourDates} />}
      {(albums.length > 0 || newReleases.length > 0) && <Music albums={albums} newReleases={newReleases} />}
      <Merch items={merch} />
    </main>
  );
}
