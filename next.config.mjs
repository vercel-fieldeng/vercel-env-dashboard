/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Geist packages ship raw TypeScript/TSX source (their exports map points
  // at ./src/*), so Next must transpile them from node_modules.
  transpilePackages: [
    '@vercel/geistcn',
    '@vercel/geistcn-assets',
    '@vercel/next-themes',
    '@vercel/geist-test-utils',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
