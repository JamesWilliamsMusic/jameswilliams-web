import Link from 'next/link';
import type { SiteSettings } from '@/lib/webiny/types';
import { getSiteSettings } from '@/lib/webiny/api';

const socialLinks = [
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'spotifyUrl', label: 'Spotify' },
  { key: 'appleMusicUrl', label: 'Apple Music' },
  { key: 'youtubeUrl', label: 'YouTube' },
  { key: 'tiktokUrl', label: 'TikTok' },
] as const;

export default async function Footer() {
  let settings: SiteSettings | null = null;
  try {
    settings = await getSiteSettings();
  } catch {
    // CMS unreachable — render minimal footer
  }

  const links = settings
    ? socialLinks.filter((link) => settings![link.key as keyof SiteSettings])
    : [];

  return (
    <footer className="py-20 md:py-28 px-6 md:px-12 bg-[rgba(237,228,210,0.30)] border-t border-[rgba(168,113,42,0.10)]">
      <div className="max-w-[1280px] mx-auto text-center">
        {/* Faded Logo */}
        <p
          className="font-elegant text-5xl text-[var(--color-text-subtle)] mb-12"
          style={{ fontStyle: 'italic' }}
          aria-hidden="true"
        >
          {settings?.artistName ?? 'James Williams'}
        </p>

        {/* Social Links */}
        {links.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-3 mb-12">
            {links.map((link) => (
              <a
                key={link.key}
                href={settings![link.key as keyof SiteSettings] as string}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Footer Nav */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Link
            href="/contact"
            className="font-label text-sm text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-all duration-300"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="font-label text-sm text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-all duration-300"
          >
            Privacy Policy
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-body text-xs text-[var(--color-text-subtle)]">
          {settings?.copyright ?? `© ${new Date().getFullYear()} James Williams. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
