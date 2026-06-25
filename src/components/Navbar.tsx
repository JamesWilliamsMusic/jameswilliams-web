'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(247,243,237,0.90)] backdrop-blur-[20px] border-b border-[var(--color-surface1)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        <a
          href="#"
          className="font-elegant text-2xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic"
          style={{ fontStyle: 'italic' }}
        >
          James Williams
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Tour', 'Music', 'Merch'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-5 h-[1.5px] bg-[var(--color-text)] transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
          <span className={`w-5 h-[1.5px] bg-[var(--color-text)] transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-[1.5px] bg-[var(--color-text)] transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[rgba(247,243,237,0.95)] backdrop-blur-[20px] border-b border-[var(--color-surface1)] px-6 pb-6 pt-2">
          {['Tour', 'Music', 'Merch'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
