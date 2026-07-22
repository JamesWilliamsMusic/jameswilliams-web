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

function isDatePast(dateStr: string): boolean {
  const tourDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tourDate < today;
}

function TourRow({ tourDate, index, isPast }: { tourDate: TourDate; index: number; isPast?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '-80px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group flex items-center justify-between py-5 hairline transition-all duration-500 hover:bg-[rgba(237,228,210,0.60)] px-4 -mx-4 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${isPast ? 'opacity-60' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Date */}
      <div className="flex items-center gap-6 md:gap-10">
        <span className={`font-display text-[2.5rem] min-w-[128px] ${isPast ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-amber)]'}`}>
          {formatDate(tourDate.date)}
        </span>
        <div>
          <p className="font-body font-medium text-lg text-[var(--color-text)]">
            {tourDate.city}, {tourDate.state}
          </p>
          <p className="font-body text-sm text-[var(--color-text-muted)] mt-0.5">
            {tourDate.venue}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div>
        {isPast ? (
          <span className="font-label text-[var(--color-text-subtle)] text-sm">
            Past
          </span>
        ) : tourDate.status === 'sold_out' ? (
          <span className="font-label text-[var(--color-text-subtle)]">
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
  const [showPast, setShowPast] = useState(false);

  const upcomingDates = dates.filter((d) => !isDatePast(d.date));
  const pastDates = dates.filter((d) => isDatePast(d.date));

  return (
    <section id="shows" className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">The Itinerary</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          Tour Dates
        </h2>

        {/* Upcoming dates */}
        {upcomingDates.length > 0 ? (
          <div>
            {upcomingDates.map((tourDate, i) => (
              <TourRow key={tourDate.id} tourDate={tourDate} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="font-elegant text-xl text-[var(--color-text)] opacity-60" style={{ fontStyle: 'italic' }}>
              No upcoming shows — stay tuned for announcements
            </p>
          </div>
        )}

        {/* Past dates dropdown */}
        {pastDates.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--color-surface2)]">
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-3 font-label text-sm text-[var(--color-text)] opacity-60 hover:opacity-100 hover:text-[var(--color-amber)] transition-all duration-300"
              aria-expanded={showPast}
              aria-controls="past-tour-dates"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${showPast ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Past Shows ({pastDates.length})
            </button>

            {showPast && (
              <div id="past-tour-dates" className="mt-4">
                {pastDates.map((tourDate, i) => (
                  <TourRow key={tourDate.id} tourDate={tourDate} index={i} isPast />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
