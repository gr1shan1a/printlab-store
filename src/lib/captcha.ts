export async function verifyCaptcha(token: unknown, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (typeof token !== "string" || !token || token.length > 2048 || !secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body,
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    const result = await response.json() as { success?: boolean; hostname?: string };
    const allowedHostnames = (process.env.TURNSTILE_HOSTNAMES || "").split(",").map(value => value.trim()).filter(Boolean);
    const hostnameMatches = !allowedHostnames.length || (typeof result.hostname === "string" && allowedHostnames.includes(result.hostname));
    return response.ok && result.success === true && hostnameMatches;
  } catch {
    return false;
  }
}
