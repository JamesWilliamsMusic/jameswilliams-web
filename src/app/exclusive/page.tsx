import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getExclusivePosts } from '@/lib/webiny/api';
import PostList from '@/components/exclusive/PostList';
import ContentTeaser from '@/components/exclusive/ContentTeaser';

export const metadata: Metadata = {
  title: 'Exclusive Content | James Williams',
  description: 'Members-only blog posts, announcements, and behind-the-scenes content from James Williams.',
};

const POSTS_PER_PAGE = 10;

interface ExclusivePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ExclusivePage({ searchParams }: ExclusivePageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const isAuthenticated = !!accessToken;

  // If not authenticated, show the teaser
  if (!isAuthenticated) {
    return (
      <section className="py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <p className="font-label text-[var(--color-amber)] mb-3">Members Only</p>
          <h1 className="font-display text-[7vw] md:text-[4vw] text-[var(--color-text)] leading-none mb-4">
            Exclusive Content
          </h1>
          <p
            className="font-elegant text-lg text-[var(--color-text)] opacity-60 mb-16"
            style={{ fontStyle: 'italic' }}
          >
            Behind-the-scenes stories, announcements, and more
          </p>

          <ContentTeaser />
        </div>
      </section>
    );
  }

  // Authenticated — show full content
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { posts, total, hasMore } = await getExclusivePosts(currentPage, POSTS_PER_PAGE);
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <section className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <p className="font-label text-[var(--color-amber)] mb-3">Members Only</p>
        <h1 className="font-display text-[7vw] md:text-[4vw] text-[var(--color-text)] leading-none mb-4">
          Exclusive Content
        </h1>
        <p className="font-elegant text-lg text-[var(--color-text)] opacity-60 mb-16" style={{ fontStyle: 'italic' }}>
          Behind-the-scenes stories, announcements, and more
        </p>

        {/* Posts or Empty State */}
        {posts.length > 0 ? (
          <>
            <PostList posts={posts} />

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="mt-16 flex items-center justify-center gap-4"
                aria-label="Pagination"
              >
                {currentPage > 1 && (
                  <Link
                    href={`/exclusive?page=${currentPage - 1}`}
                    className="inline-block px-6 py-2.5 border border-[var(--color-amber)] text-[var(--color-amber)] font-label transition-all duration-300 hover:bg-[var(--color-amber)] hover:text-[var(--color-bg)]"
                  >
                    Previous
                  </Link>
                )}

                <span className="font-body text-sm text-[var(--color-text)] opacity-60">
                  Page {currentPage} of {totalPages}
                </span>

                {hasMore && (
                  <Link
                    href={`/exclusive?page=${currentPage + 1}`}
                    className="inline-block px-6 py-2.5 border border-[var(--color-amber)] text-[var(--color-amber)] font-label transition-all duration-300 hover:bg-[var(--color-amber)] hover:text-[var(--color-bg)]"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(168,113,42,0.1)] mb-6">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-amber)"
                strokeWidth="1.5"
              >
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
              </svg>
            </div>
            <h3 className="font-display text-2xl text-[var(--color-text)] mb-2">
              No posts yet
            </h3>
            <p className="font-body text-[var(--color-text)] opacity-60 max-w-md mx-auto">
              Exclusive content is on its way. Check back soon for behind-the-scenes stories and announcements.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
