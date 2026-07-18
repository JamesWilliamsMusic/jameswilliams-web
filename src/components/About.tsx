'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import type { AboutContent } from '@/lib/webiny/types';

interface AboutProps {
  about: AboutContent;
}

export default function About({ about }: AboutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '-100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="py-24 md:py-40 px-6 md:px-12">
      <div
        ref={ref}
        className={`max-w-[1280px] mx-auto transition-all duration-1000 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <p className="font-label text-[var(--color-amber)] mb-3">The Artist</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          {about.heading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image */}
          {about.image && (
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface1)]">
              <Image
                src={about.image}
                alt={about.heading}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}

          {/* Text */}
          <div className={about.image ? '' : 'md:col-span-2 max-w-2xl'}>
            <p className="font-body text-base md:text-lg text-[var(--color-text)] opacity-80 leading-relaxed whitespace-pre-line">
              {about.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
