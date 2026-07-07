'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Album } from '@/lib/webiny/types';

interface MusicProps {
  albums: Album[];
}

export default function Music({ albums }: MusicProps) {
  const album = albums[0];
  const [activeTrack, setActiveTrack] = useState(0);
  const tracks = album?.tracks ?? [];

  if (!album) return null;

  return (
    <section id="music" className="py-24 md:py-40 px-6 md:px-12 bg-[rgba(237,228,210,0.40)]">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">The Soundscape</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          Music
        </h2>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Left — Album Art */}
          <div className={tracks.length > 0 ? 'md:w-[60%]' : 'md:w-full max-w-lg mx-auto'}>
            <div className="group relative aspect-square overflow-hidden shadow-[0_24px_80px_rgba(168,113,42,0.10)]">
              {album.coverImage ? (
                <Image
                  src={album.coverImage}
                  alt={`${album.title} album artwork`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface1)]" />
              )}
              <div className="absolute inset-0 bg-[rgba(30,26,18,0)] group-hover:bg-[rgba(30,26,18,0.10)] transition-all duration-500 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[var(--color-amber)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-bg)">
                    <polygon points="8,5 20,12 8,19" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="font-elegant text-[2rem] text-[var(--color-text)] mt-6 not-italic" style={{ fontStyle: 'italic' }}>
              {album.title}
            </h3>
            <p className="font-body text-sm text-[var(--color-text)] opacity-50 mt-1">
              {album.year}{tracks.length > 0 ? ` · ${tracks.length} Tracks` : ''}
            </p>
          </div>

          {/* Right — Tracklist (only if tracks exist) */}
          {tracks.length > 0 && (
            <div className="md:w-[40%]">
              <p className="font-label text-[var(--color-amber)] mb-4">Tracklist</p>

              <div>
                {tracks.map((track, index) => (
                  <button
                    key={track.title}
                    onClick={() => setActiveTrack(index)}
                    className={`w-full flex items-center justify-between py-4 hairline transition-all duration-300 text-left px-3 -mx-3 ${
                      activeTrack === index
                        ? 'bg-[rgba(233,223,200,0.40)]'
                        : 'hover:bg-[rgba(233,223,200,0.20)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-body text-xs tabular-nums w-5 ${
                          activeTrack === index ? 'text-[var(--color-amber)]' : 'text-[var(--color-text)] opacity-30'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-body text-[15px] ${
                          activeTrack === index ? 'text-[var(--color-amber)]' : 'text-[var(--color-text)]'
                        }`}
                      >
                        {track.title}
                      </span>
                    </div>
                    <span className="font-body text-xs tabular-nums text-[var(--color-text)] opacity-30">
                      {track.duration}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mini Player */}
              <div className="mt-6 pt-6 hairline">
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 border border-[var(--color-amber)] flex items-center justify-center rounded-full hover:bg-[var(--color-amber)] group/play transition-all duration-300">
                    <svg width="12" height="12" viewBox="0 0 24 24" className="fill-[var(--color-amber)] group-hover/play:fill-[var(--color-bg)] transition-colors duration-300">
                      <polygon points="8,5 20,12 8,19" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <p className="font-body font-medium text-sm text-[var(--color-text)]">
                      {tracks[activeTrack]?.title}
                    </p>
                    <p className="font-body text-xs text-[var(--color-text)] opacity-40">
                      {album.title}
                    </p>
                  </div>
                  <span className="font-body text-xs tabular-nums text-[var(--color-text)] opacity-30">
                    {tracks[activeTrack]?.duration}
                  </span>
                </div>
                <div className="mt-3 h-[2px] bg-[rgba(168,113,42,0.15)] overflow-hidden">
                  <div className="h-full bg-[var(--color-amber)] w-[35%] transition-all duration-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
