import type { SiteSettings } from '@/lib/webiny/types';

interface FooterProps {
  settings: SiteSettings;
}

const platformIcons: Record<string, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="py-16 px-4 bg-black border-t border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-2xl font-bold text-white mb-8">{settings.artistName}</p>

        <div className="flex items-center justify-center gap-6 mb-8">
          {settings.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-amber-400 transition-colors text-sm uppercase tracking-wider"
            >
              {platformIcons[link.platform] ?? link.platform}
            </a>
          ))}
        </div>

        <p className="text-white/30 text-xs">{settings.copyright}</p>
      </div>
    </footer>
  );
}
