import type { TourDate } from '@/lib/webiny/types';

interface TourDatesProps {
  dates: TourDate[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate().toString().padStart(2, '0');
  return { month, day };
}

function StatusBadge({ status }: { status: TourDate['status'] }) {
  if (status === 'sold_out') {
    return (
      <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-red-900/20 text-red-400 border border-red-800 rounded-full">
        Sold Out
      </span>
    );
  }
  if (status === 'few_left') {
    return (
      <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-900/20 text-amber-400 border border-amber-800 rounded-full">
        Few Left
      </span>
    );
  }
  return null;
}

export default function TourDates({ dates }: TourDatesProps) {
  return (
    <section id="tour" className="py-24 px-4 bg-neutral-950">
      <div className="max-w-4xl mx-auto">
        <p className="text-amber-400 text-sm uppercase tracking-[0.3em] mb-2 text-center">
          The Itinerary
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Tour Dates
        </h2>

        <div className="space-y-0">
          {dates.map((tourDate) => {
            const { month, day } = formatDate(tourDate.date);
            return (
              <div
                key={tourDate.id}
                className="flex items-center justify-between py-6 border-b border-white/10 group hover:bg-white/5 transition-colors px-4 -mx-4 rounded"
              >
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[60px]">
                    <p className="text-amber-400 text-xs font-semibold uppercase">{month}</p>
                    <p className="text-white text-2xl font-bold">{day}</p>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {tourDate.city}, {tourDate.state}
                    </p>
                    <p className="text-white/50 text-sm">{tourDate.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={tourDate.status} />
                  {tourDate.status !== 'sold_out' && tourDate.rsvpUrl && (
                    <a
                      href={tourDate.rsvpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 text-xs font-semibold uppercase tracking-wider border border-amber-400 text-amber-400 rounded-full hover:bg-amber-400 hover:text-black transition-colors"
                    >
                      RSVP
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
