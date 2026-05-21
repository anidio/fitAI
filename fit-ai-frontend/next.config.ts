import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },
  // Injete as variáveis do Docker diretamente no runtime do Next.js
  env: {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL || "http://backend:8081",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081",
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  },
};

export default nextConfig;