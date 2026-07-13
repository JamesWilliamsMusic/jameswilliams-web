import Image from 'next/image';
import Link from 'next/link';
import type { ExclusivePost } from '@/lib/webiny/types';

interface PostCardProps {
  post: ExclusivePost;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/exclusive/${post.slug}`}
      className="group block bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[var(--color-amber)]"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface2)]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
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
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="font-label text-xs text-[var(--color-amber)] mb-2">
          {post.category === 'announcement' ? 'Announcement' : 'Blog'}
        </p>
        <h3 className="font-display text-lg text-[var(--color-text)] leading-snug mb-2 group-hover:text-[var(--color-amber)] transition-colors duration-300">
          {post.title}
        </h3>
        <p className="font-body text-sm text-[var(--color-text)] opacity-60 line-clamp-2 mb-3">
          {post.excerpt}
        </p>
        <p className="font-body text-xs text-[var(--color-text)] opacity-40">
          {formatDate(post.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
