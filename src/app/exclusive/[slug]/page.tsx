import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
import { getExclusivePostBySlug } from '@/lib/webiny/api';

interface ExclusivePostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ExclusivePostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getExclusivePostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found | James Williams' };
  }

  return {
    title: `${post.title} | James Williams`,
    description: post.excerpt,
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ExclusivePostPage({ params }: ExclusivePostPageProps) {
  const { slug } = await params;
  const post = await getExclusivePostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        {/* Back link */}
        <Link
          href="/exclusive"
          className="inline-flex items-center gap-2 font-label text-sm text-[var(--color-amber)] mb-10 transition-opacity duration-300 hover:opacity-70"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Exclusive Content
        </Link>

        {/* Article header */}
        <article>
          <header className="mb-12">
            <p className="font-label text-xs text-[var(--color-amber)] mb-3">
              {post.category === 'announcement' ? 'Announcement' : 'Blog'}
            </p>
            <h1 className="font-display text-[8vw] md:text-[3.5vw] text-[var(--color-text)] leading-tight mb-4">
              {post.title}
            </h1>
            <p className="font-body text-sm text-[var(--color-text)] opacity-50">
              {formatDate(post.publishedAt)}
            </p>
          </header>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-12 bg-[var(--color-surface2)]">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1280px"
                priority
              />
            </div>
          )}

          {/* Post body */}
          <div
            className="font-body text-[var(--color-text)] leading-relaxed prose prose-lg max-w-none
              [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:mt-12 [&_h2]:mb-4
              [&_h3]:font-display [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-6 [&_p]:opacity-80
              [&_a]:text-[var(--color-amber)] [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-70
              [&_img]:rounded-lg [&_img]:w-full [&_img]:h-auto
              [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-amber)] [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:opacity-80
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
              [&_li]:mb-2"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
          />
        </article>

        {/* Footer back link */}
        <div className="mt-16 pt-8 border-t border-[var(--color-surface2)]">
          <Link
            href="/exclusive"
            className="inline-flex items-center gap-2 font-label text-sm text-[var(--color-amber)] transition-opacity duration-300 hover:opacity-70"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Exclusive Content
          </Link>
        </div>
      </div>
    </section>
  );
}
