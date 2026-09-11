import type { NextConfig } from "next";

/**
 * Content-Security-Policy for served game bundles.
 *
 * `connect-src 'none'` is the load-bearing directive — it's what stops a hostile game
 * exfiltrating anything it manages to read. See docs/decisions/0001-two-origins.md.
 */
const GAME_CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@unidojo/schema"],
  async headers() {
    return [
      {
        // Served game bundles. NOTE: in this first draft these share an origin with the
        // app. The iframe uses sandbox="allow-scripts" WITHOUT allow-same-origin, which
        // drops the frame into an opaque origin with no cookie or storage access — so a
        // game still can't touch a session. Moving these to a second registrable domain
        // (defence in depth) is required before real users. See docs/01-architecture.md.
        source: "/games/:path*",
        headers: [
          { key: "Content-Security-Policy", value: GAME_CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
