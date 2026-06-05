/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/core/:path*/',
        destination: 'http://localhost:80/api/core/:path*/', // Preserve if there is one
      },
      {
        source: '/api/core/:path*',
        destination: 'http://localhost:80/api/core/:path*/', // Append if missing
      },
      {
        source: '/api/gamification/:path*/',
        destination: 'http://localhost:80/api/core/gamification/:path*/',
      },
      {
        source: '/api/gamification/:path*',
        destination: 'http://localhost:80/api/core/gamification/:path*/',
      },
      {
        source: '/api/subscriptions/:path*/',
        destination: 'http://localhost:80/api/core/subscriptions/:path*/',
      },
      {
        source: '/api/subscriptions/:path*',
        destination: 'http://localhost:80/api/core/subscriptions/:path*/',
      },
      {
        source: '/api/notifications/:path*/',
        destination: 'http://localhost:80/api/core/notifications/:path*/',
      },
      {
        source: '/api/notifications/:path*',
        destination: 'http://localhost:80/api/core/notifications/:path*/',
      },
      {
        source: '/media/:path*',
        destination: 'http://localhost:80/media/:path*', // Proxy media to Nginx
      }
    ];
  },
};

export default nextConfig;
