import { createHmac, timingSafeEqual } from "node:crypto";

function key() {
  const secret = process.env.AUTH_SECRET || "";
  if (process.env.NODE_ENV === "production" && secret.length < 32) throw new Error("AUTH_SECRET должен содержать минимум 32 символа");
  return secret || "development-only-secret";
}

export function guestOrderToken(orderId: string) {
  return createHmac("sha256", key()).update(`guest-order:${orderId}`).digest("base64url");
}

export function isValidGuestOrderToken(orderId: string, token: unknown) {
  if (typeof token !== "string" || token.length !== 43) return false;
  const expected = Buffer.from(guestOrderToken(orderId));
  const supplied = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
