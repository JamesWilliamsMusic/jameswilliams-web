import {
  loginSchema,
  signupSchema,
  confirmSignupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  preferencesSchema,
} from '@/lib/validation/schemas';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'fan@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects email longer than 254 characters', () => {
    const result = loginSchema.safeParse({
      email: `${'a'.repeat(246)}@test.com`,
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'fan@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password longer than 128 characters', () => {
    const result = loginSchema.safeParse({
      email: 'fan@example.com',
      password: 'a'.repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it('does NOT enforce password complexity rules', () => {
    // Login just checks length, not complexity
    const result = loginSchema.safeParse({
      email: 'fan@example.com',
      password: 'alllowercase',
    });
    expect(result.success).toBe(true);
  });
});

describe('signupSchema', () => {
  const validInput = {
    email: 'fan@example.com',
    password: 'Str0ng!Pass',
    consentAccepted: true as const,
  };

  it('accepts valid signup input', () => {
    const result = signupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects password without uppercase letter', () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: 'str0ng!pass',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Must contain at least one uppercase letter');
    }
  });

  it('rejects password without lowercase letter', () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: 'STR0NG!PASS',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Must contain at least one lowercase letter');
    }
  });

  it('rejects password without a number', () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: 'Strong!Pass',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Must contain at least one number');
    }
  });

  it('rejects password without a special character', () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: 'Str0ngPass1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Must contain at least one special character');
    }
  });

  it('rejects consentAccepted=false', () => {
    const result = signupSchema.safeParse({
      ...validInput,
      consentAccepted: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('You must accept the privacy policy');
    }
  });

  it('rejects missing consentAccepted', () => {
    const { consentAccepted, ...withoutConsent } = validInput;
    const result = signupSchema.safeParse(withoutConsent);
    expect(result.success).toBe(false);
  });
});

describe('confirmSignupSchema', () => {
  it('accepts valid email and 6-digit code', () => {
    const result = confirmSignupSchema.safeParse({
      email: 'fan@example.com',
      code: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects code with non-digit characters', () => {
    const result = confirmSignupSchema.safeParse({
      email: 'fan@example.com',
      code: 'abcdef',
    });
    expect(result.success).toBe(false);
  });

  it('rejects code shorter than 6 characters', () => {
    const result = confirmSignupSchema.safeParse({
      email: 'fan@example.com',
      code: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects code longer than 6 characters', () => {
    const result = confirmSignupSchema.safeParse({
      email: 'fan@example.com',
      code: '1234567',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'fan@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const validInput = {
    email: 'fan@example.com',
    code: '123456',
    newPassword: 'NewStr0ng!',
  };

  it('accepts valid input', () => {
    const result = resetPasswordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects code with non-digits', () => {
    const result = resetPasswordSchema.safeParse({
      ...validInput,
      code: 'abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak newPassword', () => {
    const result = resetPasswordSchema.safeParse({
      ...validInput,
      newPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('enforces password complexity on newPassword', () => {
    const result = resetPasswordSchema.safeParse({
      ...validInput,
      newPassword: 'alllowercase1!',
    });
    expect(result.success).toBe(false);
  });
});

describe('preferencesSchema', () => {
  it('accepts valid preferences', () => {
    const result = preferencesSchema.safeParse({
      categories: {
        new_song: true,
        new_album: false,
        blog_post: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean category values', () => {
    const result = preferencesSchema.safeParse({
      categories: {
        new_song: 'yes',
        new_album: false,
        blog_post: true,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing category fields', () => {
    const result = preferencesSchema.safeParse({
      categories: {
        new_song: true,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing categories object', () => {
    const result = preferencesSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
