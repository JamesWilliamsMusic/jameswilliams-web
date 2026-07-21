import type { Metadata } from 'next';
import type { SiteSettings } from '@/lib/webiny/types';
import { getSiteSettings } from '@/lib/webiny/api';
import { resolveArtistName, resolveFavicon } from '@/lib/metadata/helpers';
import { AuthProvider } from '@/components/auth/AuthGuard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  let settings: SiteSettings | null = null;
  try {
    settings = await getSiteSettings();
  } catch {
    // CMS unreachable — use defaults
  }

  const artistName = resolveArtistName(settings);
  const faviconUrl = resolveFavicon(settings);

  return {
    title: { default: artistName, template: `${artistName} | %s` },
    description: 'Tour dates, music, and merch from James Williams.',
    icons: { icon: faviconUrl },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
