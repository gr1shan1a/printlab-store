import type { NextConfig } from "next";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" }
  ,...(process.env.NEXT_PUBLIC_STORE_URL?.startsWith("https://")?[{key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"}]:[])
];
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/uploads/models/:path*", headers: [
        { key: "Content-Disposition", value: "attachment" },
        { key: "Content-Security-Policy", value: "sandbox; default-src 'none'" },
      ] },
      { source: "/uploads/print-files/:path*", headers: [
        { key: "Content-Disposition", value: "attachment" },
        { key: "Content-Security-Policy", value: "sandbox; default-src 'none'" },
      ] },
    ];
  },
};
export default config;
