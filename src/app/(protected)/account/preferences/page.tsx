import PreferencesForm from '@/components/account/PreferencesForm';

export const metadata = {
  title: 'Notification Preferences | James Williams',
  description: 'Manage your notification preferences for new music and content.',
};

export default function PreferencesPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a
            href="/"
            className="font-elegant text-3xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic inline-block"
            style={{ fontStyle: 'italic' }}
          >
            James Williams
          </a>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] p-8 shadow-sm">
          <h1 className="font-display text-3xl text-center text-[var(--color-text)] mb-2">
            Notifications
          </h1>
          <p className="font-elegant text-center text-[var(--color-text)]/60 text-lg mb-8">
            Choose what you&apos;d like to hear about
          </p>

          <PreferencesForm />
        </div>

        <div className="text-center mt-6">
          <a
            href="/account"
            className="text-sm text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200"
          >
            ← Back to Account
          </a>
        </div>
      </div>
    </main>
  );
}
