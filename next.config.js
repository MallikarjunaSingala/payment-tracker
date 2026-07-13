/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
    // pdfkit reads its standard-font metrics (.afm) files from disk at
    // runtime relative to its own module directory. If webpack bundles it
    // into a numbered chunk file (e.g. .next/server/chunks/636.js), that
    // lookup breaks because the .afm files never get copied next to the
    // chunk (confirmed in production: ENOENT open '.../chunks/data/Helvetica.afm').
    // Marking it (and its font-parsing deps) as external server packages
    // keeps them as real node_modules requires at runtime, so Vercel's
    // file tracer follows the real file paths and bundles the .afm data
    // files correctly instead of losing them in a renamed chunk.
    serverComponentsExternalPackages: [
      "pdfkit",
      "fontkit",
      "linebreak",
      "unicode-properties",
      "brotli",
    ],
  },
};

module.exports = nextConfig;
