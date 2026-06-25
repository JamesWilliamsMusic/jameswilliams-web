import type { HeroContent } from '@/lib/webiny/types';

interface HeroProps {
  hero: HeroContent;
}

export default function Hero({ hero }: HeroProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hero.backgroundImage})` }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[rgba(247,243,237,0.20)] to-transparent" style={{ backgroundSize: '100% 100%' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(247,243,237,0.70)] to-transparent" style={{ backgroundSize: '60% 100%', backgroundRepeat: 'no-repeat' }} />
      <div className="absolute inset-0 bg-[rgba(168,113,42,0.05)]" />

      {/* Content — Bottom Left */}
      <div className="absolute bottom-28 left-6 md:left-12 z-10">
        <h1 className="font-display text-[15vw] md:text-[12vw] leading-[0.85] text-[var(--color-text)] animate-slide-up">
          {hero.title.includes(' ') ? (
            <>
              {hero.title.split(' ')[0]}
              <br />
              {hero.title.split(' ').slice(1).join(' ')}
            </>
          ) : (
            <>
              JAMES
              <br />
              WILLIAMS
            </>
          )}
        </h1>

        <p
          className="font-elegant text-2xl md:text-[2rem] text-[var(--color-text)] opacity-80 mt-6 animate-fade-in"
          style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          {hero.tagline}
        </p>

        <p
          className="font-label text-[var(--color-amber)] mt-8 animate-fade-in"
          style={{ animationDelay: '1200ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          {hero.socialHandle}
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bob">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--color-amber)] opacity-60"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
