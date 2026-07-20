'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthGuard';
import { featureFlags } from '@/lib/feature-flags';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        dropdownButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen]);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    await logout();
  }, [logout]);

  // Get user initial for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(247,243,237,0.90)] backdrop-blur-[20px] border-b border-[var(--color-surface1)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        <Link
          href="/"
          className="font-elegant text-2xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic"
          style={{ fontStyle: 'italic' }}
        >
          James Williams
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Tour', 'Music', 'Merch'].map((link) => (
            <a
              key={link}
              href={`/#${link.toLowerCase()}`}
              className="font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
            >
              {link}
            </a>
          ))}
          <Link
            href="/contact"
            className="font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
          >
            Contact
          </Link>

          {/* Auth state: show login/signup or account dropdown */}
          {featureFlags.auth && isAuthenticated === false && (
            <>
              <Link
                href="/login"
                className="font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="font-label px-4 py-2 bg-[var(--color-amber)] text-white rounded-md hover:opacity-90 transition-opacity duration-300"
              >
                Sign Up
              </Link>
            </>
          )}

          {featureFlags.auth && isAuthenticated === true && (
            <div className="relative">
              <button
                ref={dropdownButtonRef}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-amber)] text-white font-label text-sm hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-offset-2"
              >
                {userInitial}
              </button>

              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 mt-2 w-52 bg-[rgba(247,243,237,0.98)] backdrop-blur-[20px] border border-[var(--color-surface1)] rounded-lg shadow-lg py-2 z-50"
                >
                  <Link
                    href="/exclusive"
                    role="menuitem"
                    tabIndex={0}
                    className="block px-4 py-2.5 font-label text-sm text-[var(--color-text)] hover:bg-[var(--color-surface1)] hover:text-[var(--color-amber)] transition-colors duration-200"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Exclusive Content
                  </Link>
                  <Link
                    href="/account"
                    role="menuitem"
                    tabIndex={0}
                    className="block px-4 py-2.5 font-label text-sm text-[var(--color-text)] hover:bg-[var(--color-surface1)] hover:text-[var(--color-amber)] transition-colors duration-200"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <div className="border-t border-[var(--color-surface1)] my-1" />
                  <button
                    role="menuitem"
                    tabIndex={0}
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 font-label text-sm text-[var(--color-text)] hover:bg-[var(--color-surface1)] hover:text-[var(--color-amber)] transition-colors duration-200"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
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
              href={`/#${link.toLowerCase()}`}
              className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
          <Link
            href="/contact"
            className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>

          {/* Mobile auth links */}
          {featureFlags.auth && (
          <div className="border-t border-[var(--color-surface1)] mt-3 pt-3">
            {isAuthenticated === false && (
              <>
                <Link
                  href="/login"
                  className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block py-3 font-label text-[var(--color-amber)] hover:opacity-80 transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}

            {isAuthenticated === true && (
              <>
                <Link
                  href="/exclusive"
                  className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Exclusive Content
                </Link>
                <Link
                  href="/account"
                  className="block py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-3 font-label text-[var(--color-text)] opacity-70 hover:text-[var(--color-amber)] hover:opacity-100 transition-all duration-300"
                >
                  Log Out
                </button>
              </>
            )}
          </div>
          )}
        </div>
      )}
    </nav>
  );
}
