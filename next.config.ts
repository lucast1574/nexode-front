import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'gitlab.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
