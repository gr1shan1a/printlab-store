import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

afterEach(() => vi.unstubAllEnvs());
describe('request origin boundary', () => {
  function request(origin: string, extra: Record<string,string> = {}) {
    vi.stubEnv('NEXT_PUBLIC_STORE_URL', 'https://v2gr1.ru');
    return new NextRequest('https://v2gr1.ru/api/checkout', {method:'POST',headers:{origin,'content-type':'application/json',...extra},body:'{}'});
  }
  it('allows the configured HTTPS origin', () => expect(middleware(request('https://v2gr1.ru')).status).toBe(200));
  it('rejects a forged forwarded host', () => expect(middleware(request('https://evil.example',{'x-forwarded-host':'evil.example'})).status).toBe(403));
  it('rejects the wrong scheme', () => expect(middleware(request('http://v2gr1.ru')).status).toBe(403));
  it('retains origin checks for prefetch headers', () => expect(middleware(request('https://evil.example',{'next-router-prefetch':'1',purpose:'prefetch'})).status).toBe(403));
  it('rejects cross-site requests even with a matching origin header', () => expect(middleware(request('https://v2gr1.ru',{'sec-fetch-site':'cross-site'})).status).toBe(403));
});
