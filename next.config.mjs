/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/core/:path*',
        destination: 'http://localhost:80/api/core/:path*', // Proxy to Nginx
      },
      {
        source: '/api/gamification/:path*',
        destination: 'http://localhost:80/api/core/gamification/:path*', // Proxy to Nginx
      },
      {
        source: '/api/subscriptions/:path*',
        destination: 'http://localhost:80/api/core/subscriptions/:path*', // Proxy to Nginx
      },
      {
        source: '/media/:path*',
        destination: 'http://localhost:80/media/:path*', // Proxy media to Nginx
      }
    ];
  },
};

export default nextConfig;
