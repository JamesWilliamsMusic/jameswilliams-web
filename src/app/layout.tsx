import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'James Williams',
  description: 'James Williams web application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
