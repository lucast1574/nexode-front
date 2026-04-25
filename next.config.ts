import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `output: "standalone"` was incompatible with our Dockerfile (CMD npm start → next start),
  // which made every route 404 even though the server reported "Ready". Standalone mode
  // requires running `node .next/standalone/server.js` directly. We removed it because the
  // current Docker image bundles the full .next/ output and runs `next start` against it.
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
