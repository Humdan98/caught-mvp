import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the libSQL clients out of the bundle. Production (Turso) only loads the pure-JS web client;
  // the native SQLite binary is only used for the local file database (see src/lib/db.ts).
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
  poweredByHeader: false,
  // The receipt image reads its fonts from disk at runtime; make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/receipt/[id]/image": ["./node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.ttf", "./node_modules/geist/dist/fonts/geist-mono/GeistMono-SemiBold.ttf", "./node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: { bodySizeLimit: "4.5mb" }, // image uploads (Vercel caps request bodies at 4.5 MB)
  },
};

export default nextConfig;
