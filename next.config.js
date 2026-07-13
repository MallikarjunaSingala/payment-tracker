/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
    // pdfkit reads its standard-font metrics (.afm) files from disk at
    // runtime via a dynamic path, which Next's build tracer can miss when
    // bundling serverless functions for Vercel. Force-include them.
    outputFileTracingIncludes: {
      "/api/statement/**": ["./node_modules/pdfkit/js/data/**"],
    },
  },
};

module.exports = nextConfig;
