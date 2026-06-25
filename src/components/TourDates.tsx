'use client';

import { useRef, useEffect, useState } from 'react';
import type { TourDate } from '@/lib/webiny/types';

interface TourDatesProps {
  dates: TourDate[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}

function TourRow({ tourDate, index }: { tourDate: TourDate; index: number }) {
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
    <div
      ref={ref}
      className={`group flex items-center justify-between py-5 hairline transition-all duration-500 hover:bg-[rgba(237,228,210,0.60)] px-4 -mx-4 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Date */}
      <div className="flex items-center gap-6 md:gap-10">
        <span className="font-display text-[2.5rem] text-[var(--color-amber)] min-w-[128px]">
          {formatDate(tourDate.date)}
        </span>
        <div>
          <p className="font-body font-medium text-lg text-[var(--color-text)]">
            {tourDate.city}, {tourDate.state}
          </p>
          <p className="font-body text-sm text-[var(--color-text)] opacity-50 mt-0.5">
            {tourDate.venue}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div>
        {tourDate.status === 'sold_out' ? (
          <span className="font-label text-[var(--color-text)] opacity-30">
            Sold Out
          </span>
        ) : (
          <a
            href={tourDate.rsvpUrl ?? '#'}
            className="inline-block px-6 py-2.5 border border-[var(--color-amber)] text-[var(--color-amber)] font-label transition-all duration-300 group-hover:bg-[var(--color-amber)] group-hover:text-[var(--color-bg)]"
          >
            RSVP
          </a>
        )}
      </div>
    </div>
  );
}

export default function TourDates({ dates }: TourDatesProps) {
  return (
    <section id="tour" className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">The Itinerary</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          Tour Dates
        </h2>

        <div>
          {dates.map((tourDate, i) => (
            <TourRow key={tourDate.id} tourDate={tourDate} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
