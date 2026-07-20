import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Privacy Policy' };
}

export default function PrivacyPage() {
  return (
    <section className="py-24 md:py-40 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-label text-[var(--color-amber)] mb-3">Legal</p>
        <h1 className="font-display text-[7vw] md:text-[4vw] text-[var(--color-text)] leading-none mb-12">
          Privacy Policy
        </h1>

        <div className="font-body text-[var(--color-text)] space-y-10 max-w-3xl">
          <div>
            <h2 className="font-display text-2xl mb-4">Information We Collect</h2>
            <p className="opacity-60">
              When you submit the contact form on this website, we collect the following personal
              information:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Name</li>
              <li>Email address</li>
              <li>Subject (optional)</li>
              <li>Message content</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Purpose of Collection</h2>
            <p className="opacity-60">
              Personal information is collected solely for the purpose of responding to your
              enquiries. We do not use your data for marketing, analytics, or any other purpose.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">How Your Data Is Stored and Protected</h2>
            <p className="opacity-60">
              Contact form submissions are stored in the AWS ap-southeast-2 (Sydney) region. Data is
              encrypted at rest and access is restricted to authorised personnel only.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Data Retention</h2>
            <p className="opacity-60">
              Contact form submissions are retained for 90 days, after which they are permanently
              deleted.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Your Rights</h2>
            <p className="opacity-60">
              Under the Australian Privacy Act 1988, you have the right to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of any inaccurate information</li>
              <li>
                Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)
                if you believe your privacy has been breached
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Contact Us</h2>
            <p className="opacity-60">
              For privacy-related enquiries, please contact us via the{' '}
              <a href="/contact" className="underline text-[var(--color-amber)]">
                contact form
              </a>{' '}
              with the subject &ldquo;Privacy Enquiry&rdquo;.
            </p>
          </div>

          <div>
            <p className="opacity-60 text-sm">Last updated: June 2025</p>
          </div>
        </div>
      </div>
    </section>
  );
}
