import type { HeroContent } from '@/lib/webiny/types';

interface HeroProps {
  hero: HeroContent;
}

export default function Hero({ hero }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hero.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-wider mb-4">
          {hero.title}
        </h1>
        <p className="text-xl md:text-2xl font-light tracking-wide text-amber-100 mb-8">
          {hero.tagline}
        </p>
        <p className="text-sm uppercase tracking-widest text-white/70">
          {hero.socialHandle}
        </p>
      </div>
    </section>
  );
}
