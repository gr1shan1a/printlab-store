import { expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from './password';
it('uses unique bcrypt salts, verifies correct passwords and rejects a wrong pepper', async () => {
  vi.stubEnv('PASSWORD_PEPPER', 'first-pepper-for-security-test-123456789');
  try {
    const password = 'LongPassword9-'.repeat(7);
    const [one, two] = await Promise.all([hashPassword(password), hashPassword(password)]);
    expect(one).not.toBe(two);
    expect(one).toMatch(/^\$2[ab]\$12\$/);
    expect((await verifyPassword(password, one)).valid).toBe(true);
    expect((await verifyPassword(password + 'different', one)).valid).toBe(false);
    vi.stubEnv('PASSWORD_PEPPER', 'different-pepper-for-security-test-12345');
    expect((await verifyPassword(password, one)).valid).toBe(false);
  } finally { vi.unstubAllEnvs(); }
}, 15_000);
