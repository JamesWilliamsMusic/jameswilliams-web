import LoginForm from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

export const metadata = {
  title: 'Sign In | James Williams',
  description: 'Sign in to your fan account to access exclusive content.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams;

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
            Welcome Back
          </h1>
          <p className="font-elegant text-center text-[var(--color-text)]/60 text-lg mb-8">
            Sign in to access exclusive content
          </p>

          <LoginForm returnTo={returnTo} />
        </div>
      </div>
    </main>
  );
}
