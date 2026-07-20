import type { Metadata } from 'next';
import Image from 'next/image';
import ContactForm from '@/components/contact/ContactForm';
import { getContactPage } from '@/lib/webiny/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Contact' };
}

export default async function ContactPage() {
  const contactPage = await getContactPage();

  return (
    <section className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">Get In Touch</p>
        <h1 className="font-display text-[7vw] md:text-[4vw] text-[var(--color-text)] leading-none mb-12">
          Contact
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Form */}
          <div>
            <ContactForm />
          </div>

          {/* Image */}
          {contactPage?.image && (
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface1)] hidden md:block">
              <Image
                src={contactPage.image}
                alt="Contact"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
