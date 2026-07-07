'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import type { MerchItem } from '@/lib/webiny/types';

interface MerchProps {
  items: MerchItem[];
}

function MerchCard({ item, index }: { item: MerchItem; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '-100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      href={item.shopUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block transition-all duration-800 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative overflow-hidden bg-[var(--color-surface1)]" style={{ aspectRatio: '4/5' }}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface2)]" />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[rgba(30,26,18,0)] group-hover:bg-[rgba(30,26,18,0.10)] transition-all duration-500" />
        {/* Floating title on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <p className="font-elegant text-xl text-[var(--color-bg)]" style={{ fontStyle: 'italic', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {item.title}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="font-body text-sm text-[var(--color-text)] group-hover:text-[var(--color-amber)] transition-colors duration-300">
          {item.title}
        </p>
        <p className="font-body text-sm text-[var(--color-text)] opacity-50">
          ${item.price}
        </p>
      </div>
    </a>
  );
}

export default function Merch({ items }: MerchProps) {
  if (items.length === 0) return null;

  return (
    <section id="merch" className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">The Atelier</p>
        <h2 className="font-display text-[7vw] md:text-[6vw] text-[var(--color-text)] leading-none mb-16">
          Merch
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <MerchCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
