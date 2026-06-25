import Image from 'next/image';
import type { Album } from '@/lib/webiny/types';

interface MusicProps {
  albums: Album[];
}

export default function Music({ albums }: MusicProps) {
  if (albums.length === 0) return null;

  const album = albums[0];

  return (
    <section id="music" className="py-24 px-4 bg-neutral-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-amber-400 text-sm uppercase tracking-[0.3em] mb-2 text-center">
          The Soundscape
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Music
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={album.coverImage}
              alt={`${album.title} album artwork`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{album.title}</h3>
            <p className="text-white/50 text-sm mb-8">
              {album.year} · {album.trackCount} Tracks · {album.totalDuration}
            </p>

            <p className="text-amber-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">
              Tracklist
            </p>

            <div className="space-y-0">
              {album.tracks.map((track, index) => (
                <div
                  key={track.title}
                  className="flex items-center justify-between py-3 border-b border-white/10 group hover:bg-white/5 transition-colors px-3 -mx-3 rounded"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/30 text-sm font-mono w-6">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white text-sm">{track.title}</span>
                  </div>
                  <span className="text-white/40 text-sm font-mono">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
