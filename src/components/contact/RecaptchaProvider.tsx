'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
console.log(siteKey)

export default function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  if (!siteKey) {
    // No site key configured — render children without reCAPTCHA (dev mode)
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
