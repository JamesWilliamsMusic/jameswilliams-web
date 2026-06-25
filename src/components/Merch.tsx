import Image from 'next/image';
import type { MerchItem } from '@/lib/webiny/types';

interface MerchProps {
  items: MerchItem[];
}

export default function Merch({ items }: MerchProps) {
  if (items.length === 0) return null;

  return (
    <section id="merch" className="py-24 px-4 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <p className="text-amber-400 text-sm uppercase tracking-[0.3em] mb-2 text-center">
          The Atelier
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Merch
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.shopUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-neutral-800">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <h3 className="text-white font-medium text-sm">{item.title}</h3>
              <p className="text-amber-400 text-sm font-semibold">${item.price}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
