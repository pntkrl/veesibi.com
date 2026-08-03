import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages compatibility
  // Use @cloudflare/next-on-pages for building
  experimental: {
    // Enable React Compiler for better perf on edge
  },
  // Output standalone for Cloudflare Pages
  output: "standalone",
  // Disable image optimization (not supported on Cloudflare Pages without config)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
