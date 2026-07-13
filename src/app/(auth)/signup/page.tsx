import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Create Account | James Williams',
  description: 'Sign up for a fan account to access exclusive content and notifications.',
};

export default function SignupPage() {
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
            Create Account
          </h1>
          <p className="font-elegant text-center text-[var(--color-text)]/60 text-lg mb-8">
            Join to access exclusive content
          </p>

          <SignupForm />
        </div>
      </div>
    </main>
  );
}
