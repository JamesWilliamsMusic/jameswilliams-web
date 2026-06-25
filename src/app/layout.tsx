import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'James Williams | Golden Coast Sessions',
  description: 'A Symphony of the Pacific — Tour dates, music, and merch from James Williams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
