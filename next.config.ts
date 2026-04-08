import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the data/ JSON files into every serverless function on Vercel.
  // Without this, /var/task/data/*.json is missing at runtime.
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*"],
    "/admin/**/*": ["./data/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
