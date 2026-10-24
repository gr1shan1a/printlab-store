import { describe, expect, it } from "vitest";
import { safeJson } from "./safe-json";
import { safeRedirectPath } from "./safe-redirect";
import { cdekDownloadUrl } from "./cdek-download";
import { checkoutSchema } from "./validation";

describe("HTML and redirect boundaries", () => {
  it("escapes closing script tags without changing the JSON data", () => {
    const value = { name: '</script><script>alert(1)</script>&\u2028\u2029' };
    const json = safeJson(value);
    expect(json).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(json)).toEqual(value);
  });
  it.each(['//evil.example', '/\\evil.example', '/\nevil.example', 'javascript:alert(1)', 'https://evil.example'])("rejects external redirect %s", value => {
    expect(safeRedirectPath(value)).toBe('/account');
  });
  it("keeps a local checkout return path", () => {
    expect(safeRedirectPath('/checkout?step=2')).toBe('/checkout?step=2');
  });
  it.each(['https://api.cdek.ru.evil.example/file', 'http://api.cdek.ru/file', 'https://127.0.0.1/file', 'https://evil.example/api.cdek.ru', 'https://user:pass@api.cdek.ru/file'])("rejects untrusted document URL %s", value => {
    expect(() => cdekDownloadUrl(value)).toThrow();
  });
  it("allows the CDEK API document origin", () => {
    expect(cdekDownloadUrl('https://api.cdek.ru/v2/print/test.pdf').hostname).toBe('api.cdek.ru');
  });
});

describe("checkout input", () => {
  const input = { firstName: 'Иван', lastName: 'Иванов', phone: '+7 (999) 999-99-99', email: 'test@example.com', city: 'Москва', address: '', deliveryMethod: 'pickup', paymentMethod: 'cash', items: [{ variantId: 'cl000000000000000000000000', quantity: 1 }] };
  it("keeps SQL-like content as an ordinary string", () => {
    const comment = "1'; SELECT 'DROP DATABASE ' || quote_ident(datname) || ' WITH (FORCE);' FROM pg_database WHERE datistemplate = false AND datname != 'postgres';";
    expect(checkoutSchema.parse({ ...input, comment }).comment).toBe(comment);
  });
  it("rejects overlong comments and strips privileged extra fields", () => {
    expect(checkoutSchema.safeParse({ ...input, comment: 'x'.repeat(1001) }).success).toBe(false);
    const parsed = checkoutSchema.parse({ ...input, paymentStatus: 'PAID', totalInKopecks: 1, userId: 'attacker' });
    expect(parsed).not.toHaveProperty('paymentStatus');
    expect(parsed).not.toHaveProperty('totalInKopecks');
    expect(parsed).not.toHaveProperty('userId');
  });
});
