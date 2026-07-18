'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import type { Album, NewRelease } from '@/lib/webiny/types';

interface MusicProps {
  albums: Album[];
  newReleases: NewRelease[];
}

function AlbumCard({ album, index }: { album: Album; index: number }) {
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
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface1)] shadow-sm group">
        {album.coverImage ? (
          <Image
            src={album.coverImage}
            alt={`${album.title} album artwork`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface2)]" />
        )}
        {album.embedUrl && (
          <a
            href={album.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-[rgba(30,26,18,0)] group-hover:bg-[rgba(30,26,18,0.20)] transition-all duration-500 flex items-center justify-center"
            aria-label={`Listen to ${album.title}`}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-amber)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-bg)">
                <polygon points="8,5 20,12 8,19" />
              </svg>
            </div>
          </a>
        )}
      </div>
      <h4 className="font-body text-sm text-[var(--color-text)] mt-3">{album.title}</h4>
      <p className="font-body text-xs text-[var(--color-text-muted)]">{album.year}</p>
    </div>
  );
}

function ReleaseCard({ release }: { release: NewRelease }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      {/* Cover art */}
      <div className="md:w-[40%] w-full">
        <div className="relative aspect-square overflow-hidden shadow-[0_24px_80px_rgba(168,113,42,0.10)]">
          {release.coverImage ? (
            <Image
              src={release.coverImage}
              alt={`${release.title} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-surface1)]" />
          )}
        </div>
      </div>

      {/* Info + embed */}
      <div className="md:w-[60%] w-full flex flex-col justify-center">
        <span className="font-label text-xs text-[var(--color-amber)] uppercase mb-2">
          {release.type}
        </span>
        <h3 className="font-elegant text-[2rem] md:text-[2.5rem] text-[var(--color-text)] not-italic" style={{ fontStyle: 'italic' }}>
          {release.title}
        </h3>
        <p className="font-body text-sm text-[var(--color-text-muted)] mt-1 mb-6">
          {new Date(release.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Embed player */}
        <div className="w-full rounded-lg overflow-hidden">
          <iframe
            src={release.embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Listen to ${release.title}`}
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default function Music({ albums, newReleases }: MusicProps) {
  if (albums.length === 0 && newReleases.length === 0) return null;

  return (
    <section id="music" className="py-24 md:py-40 px-6 md:px-12 bg-[rgba(237,228,210,0.40)]">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">The Soundscape</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          Music
        </h2>

        {/* New Releases */}
        {newReleases.length > 0 && (
          <div className="mb-20">
            <p className="font-label text-xs text-[var(--color-text-muted)] mb-8 uppercase tracking-widest">
              New Release{newReleases.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-16">
              {newReleases.map((release) => (
                <ReleaseCard key={release.id} release={release} />
              ))}
            </div>
          </div>
        )}

        {/* Discography */}
        {albums.length > 0 && (
          <div>
            <p className="font-label text-xs text-[var(--color-text-muted)] mb-6 uppercase tracking-widest">
              Discography
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album, i) => (
                <AlbumCard key={album.id} album={album} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
