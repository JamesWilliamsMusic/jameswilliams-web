import Link from 'next/link';

/**
 * ContentTeaser displays a blurred/faded preview of exclusive content
 * with an overlay prompting unauthenticated visitors to sign up or log in.
 */
export default function ContentTeaser() {
  return (
    <div className="relative" aria-labelledby="teaser-heading">
      {/* Blurred placeholder cards grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 select-none pointer-events-none"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PlaceholderCard key={i} index={i} />
        ))}
      </div>

      {/* Gradient fade overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent"
        aria-hidden="true"
      />

      {/* CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6 py-12 max-w-lg">
          {/* Lock icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(168,113,42,0.1)] mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-amber)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Heading */}
          <h2
            id="teaser-heading"
            className="font-display text-2xl md:text-3xl text-[var(--color-text)] leading-snug mb-3"
          >
            This content is exclusive to members
          </h2>

          {/* Subtext */}
          <p
            className="font-elegant text-base text-[var(--color-text)] opacity-60 mb-8"
            style={{ fontStyle: 'italic' }}
          >
            Sign up to unlock behind-the-scenes stories, announcements, and more from James.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-[var(--color-amber)] text-[var(--color-bg)] font-label text-sm tracking-wide rounded-sm transition-all duration-300 hover:opacity-90 hover:shadow-md"
              aria-label="Sign up for a free account"
            >
              Sign Up
            </Link>
            <Link
              href="/login?returnTo=/exclusive"
              className="inline-block px-8 py-3 border border-[var(--color-amber)] text-[var(--color-amber)] font-label text-sm tracking-wide rounded-sm transition-all duration-300 hover:bg-[var(--color-amber)] hover:text-[var(--color-bg)]"
              aria-label="Log in to access exclusive content"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A single blurred placeholder card that mimics the look of a PostCard
 * without revealing actual content.
 */
function PlaceholderCard({ index }: { index: number }) {
  // Alternate category labels for visual variety
  const categories = ['Blog', 'Announcement', 'Blog', 'Announcement', 'Blog', 'Blog'];
  const category = categories[index % categories.length];

  return (
    <div className="block bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] shadow-sm overflow-hidden blur-[6px] opacity-60">
      {/* Placeholder image area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface2)]">
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth="1"
            className="opacity-40"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="p-5">
        <p className="font-label text-xs text-[var(--color-amber)] mb-2">
          {category}
        </p>
        <div className="h-5 bg-[var(--color-surface2)] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[var(--color-surface2)] rounded w-full mb-1" />
        <div className="h-4 bg-[var(--color-surface2)] rounded w-2/3 mb-3" />
        <div className="h-3 bg-[var(--color-surface2)] rounded w-1/3" />
      </div>
    </div>
  );
}
