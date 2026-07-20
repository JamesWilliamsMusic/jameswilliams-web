import type { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Contact' };
}

export default function ContactPage() {
  return (
    <section className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">Get In Touch</p>
        <h1 className="font-display text-[7vw] md:text-[4vw] text-[var(--color-text)] leading-none mb-12">
          Contact
        </h1>

        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
