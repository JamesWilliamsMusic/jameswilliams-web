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
            <p className="opacity-60">
              James Williams Music (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is
              committed to protecting your privacy and handling your personal information in
              accordance with the <strong>Privacy Act 1988 (Cth)</strong> and the Australian Privacy
              Principles (APPs).
            </p>
            <p className="opacity-60 mt-3">
              This Privacy Policy explains how we collect, use, store, disclose, and protect your
              personal information when you visit this website.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Information We Collect</h2>
            <p className="opacity-60">
              When you submit the contact form on this website, we may collect the following personal
              information:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Name</li>
              <li>Email address</li>
              <li>Subject (optional)</li>
              <li>Message content</li>
            </ul>
            <p className="opacity-60 mt-3">
              Providing this information is voluntary. However, if you choose not to provide the
              requested information, we may be unable to respond to your enquiry.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Purpose of Collection</h2>
            <p className="opacity-60">
              We collect your personal information for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>
                Responding to enquiries and messages submitted through the contact form.
              </li>
              <li>Communicating with you regarding your enquiry.</li>
              <li>
                Protecting our website and contact form from spam and automated abuse through Google
                reCAPTCHA.
              </li>
            </ul>
            <p className="opacity-60 mt-3">
              We do <strong>not</strong> use your personal information for marketing purposes,
              mailing lists, or advertising, and we do not sell your personal information to third
              parties.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Google reCAPTCHA</h2>
            <p className="opacity-60">
              This website uses <strong>Google reCAPTCHA</strong> to help protect the contact form
              from spam, automated submissions, and abuse.
            </p>
            <p className="opacity-60 mt-3">
              Google reCAPTCHA analyses visitor interactions with the website to determine whether
              requests are made by a human or an automated system. This process may collect technical
              information, including:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>IP address</li>
              <li>Browser and device information</li>
              <li>Interaction patterns with the website</li>
              <li>Time spent on pages</li>
              <li>Other technical information required for security and fraud prevention</li>
            </ul>
            <p className="opacity-60 mt-3">
              This information is processed by Google in accordance with{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--color-amber)]"
              >
                Google&apos;s Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--color-amber)]"
              >
                Terms of Service
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Spotify Embedded Player</h2>
            <p className="opacity-60">
              This website includes embedded Spotify players to allow visitors to listen to James
              Williams&apos; music.
            </p>
            <p className="opacity-60 mt-3">
              When interacting with the Spotify player, Spotify may collect technical information
              such as:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>IP address</li>
              <li>Browser and device information</li>
              <li>Cookies and similar technologies</li>
              <li>Usage information and interaction patterns</li>
            </ul>
            <p className="opacity-60 mt-3">
              The Spotify embedded player operates within an iframe and may set third-party cookies
              within the <code className="text-sm">open.spotify.com</code> domain for essential
              functionality, session management, and analytics purposes. These cookies are set
              directly by Spotify, not by this website.
            </p>
            <p className="opacity-60 mt-3">
              This information is collected directly by Spotify and is handled in accordance with{' '}
              <a
                href="https://www.spotify.com/legal/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--color-amber)]"
              >
                Spotify&apos;s Privacy Policy
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Cookies</h2>
            <p className="opacity-60">
              This website does not use cookies for advertising, marketing, or tracking purposes.
            </p>
            <p className="opacity-60 mt-3">
              However, third-party services used by this website, including Google reCAPTCHA and the
              Spotify embedded player, may use cookies or similar technologies as part of their
              normal operation. These third-party cookies are set within their own domains and are
              governed by their respective privacy policies.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Storage and Security</h2>
            <p className="opacity-60">
              Contact form submissions are securely stored using{' '}
              <strong>Amazon Web Services (AWS)</strong> infrastructure located in{' '}
              <strong>Australia</strong>.
            </p>
            <p className="opacity-60 mt-3">
              We take reasonable steps to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Encryption of stored data (encryption at rest).</li>
              <li>Restricting access to authorised personnel only.</li>
              <li>Applying appropriate security practices for cloud-hosted infrastructure.</li>
            </ul>
            <p className="opacity-60 mt-3">
              While we take reasonable measures to protect your information, no method of electronic
              transmission or storage is completely secure, and we cannot guarantee absolute
              security.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Disclosure of Personal Information</h2>
            <p className="opacity-60">
              We do not sell, rent, or trade your personal information.
            </p>
            <p className="opacity-60 mt-3">
              Your personal information may only be disclosed:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>
                To trusted service providers required to operate this website, such as Amazon Web
                Services (AWS), Google reCAPTCHA, and Spotify where applicable.
              </li>
              <li>Where disclosure is required or authorised by Australian law.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Overseas Disclosure</h2>
            <p className="opacity-60">
              Contact form submissions are stored in Australia using Amazon Web Services (AWS).
            </p>
            <p className="opacity-60 mt-3">
              Some third-party services used by this website, including Google reCAPTCHA and Spotify,
              may process certain technical information on servers located outside Australia in
              accordance with their own privacy policies.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Data Retention</h2>
            <p className="opacity-60">
              We retain personal information only for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Respond to enquiries.</li>
              <li>Maintain records of communications.</li>
              <li>Comply with legal or business obligations.</li>
            </ul>
            <p className="opacity-60 mt-3">
              When personal information is no longer required, reasonable steps are taken to securely
              delete or de-identify the information.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Your Rights</h2>
            <p className="opacity-60">
              Under the <strong>Privacy Act 1988 (Cth)</strong>, you have the right to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 opacity-60">
              <li>Request access to the personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete personal information.</li>
              <li>Make a complaint if you believe your privacy has been breached.</li>
            </ul>
            <p className="opacity-60 mt-3">
              If you are not satisfied with our response, you may contact the{' '}
              <strong>Office of the Australian Information Commissioner (OAIC)</strong>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Contact Us</h2>
            <p className="opacity-60">
              If you have any questions about this Privacy Policy or wish to make a privacy-related
              enquiry, please contact us using the{' '}
              <a href="/contact" className="underline text-[var(--color-amber)]">
                contact form
              </a>{' '}
              on this website and include the subject &ldquo;Privacy Enquiry&rdquo;.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Changes to This Privacy Policy</h2>
            <p className="opacity-60">
              We may update this Privacy Policy from time to time to reflect changes to our website,
              services, or legal obligations.
            </p>
            <p className="opacity-60 mt-3">
              Any updates will be published on this page, and the &ldquo;Last updated&rdquo; date at
              the top of this Privacy Policy will be revised accordingly.
            </p>
          </div>

          <div>
            <p className="opacity-60 text-sm">Last updated: August 2026</p>
          </div>
        </div>
      </div>
    </section>
  );
}
