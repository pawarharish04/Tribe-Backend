import type { NextConfig } from "next";

// ─── Allowed origins ──────────────────────────────────────────────────────────
// Set CORS_ORIGIN in your .env as a comma-separated list:
//   CORS_ORIGIN=https://app.example.com,https://www.example.com
// Falls back to http://localhost:3000 in non-production builds.
const rawOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:3000'];

// next.config headers() applies a static value at build time, so we join
// the list into the string formats the CORS spec expects.
// For multi-origin dynamic enforcement at runtime, use src/middleware.ts.
const allowOrigin = rawOrigins.join(',');   // used in the header value
const allowMethods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const allowHeaders = 'Content-Type,Authorization';

const nextConfig: NextConfig = {
    reactCompiler: true,

    async headers() {
        return [
            {
                // Match all API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        // When multiple origins are allowed, the server must
                        // dynamically echo the matched origin (see middleware.ts).
                        // For single-origin or dev, this static value is sufficient.
                        value: rawOrigins.length === 1 ? rawOrigins[0] : allowOrigin,
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: allowMethods,
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: allowHeaders,
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                    // Browsers cache the preflight for 2 hours
                    {
                        key: 'Access-Control-Max-Age',
                        value: '7200',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
