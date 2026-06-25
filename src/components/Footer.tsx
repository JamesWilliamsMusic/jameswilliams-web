import type { SiteSettings } from '@/lib/webiny/types';

interface FooterProps {
  settings: SiteSettings;
}

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="py-20 md:py-28 px-6 md:px-12 bg-[rgba(237,228,210,0.30)] border-t border-[rgba(168,113,42,0.10)]">
      <div className="max-w-[1280px] mx-auto text-center">
        {/* Faded Logo */}
        <p
          className="font-elegant text-5xl text-[var(--color-text)] opacity-[0.15] mb-12"
          style={{ fontStyle: 'italic' }}
        >
          {settings.artistName}
        </p>

        {/* Social Links */}
        <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-3 mb-12">
          {settings.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label text-[var(--color-text)] opacity-40 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
            >
              {platformLabels[link.platform] ?? link.platform}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="font-body text-xs text-[var(--color-text)] opacity-20">
          {settings.copyright}
        </p>
      </div>
    </footer>
  );
}
