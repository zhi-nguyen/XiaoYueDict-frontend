/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
    return [
      {
        source: '/api/core/:path*/',
        destination: `${apiUrl}/api/core/:path*/`, // Preserve if there is one
      },
      {
        source: '/api/core/:path*',
        destination: `${apiUrl}/api/core/:path*/`, // Append if missing
      },
      {
        source: '/api/gamification/:path*/',
        destination: `${apiUrl}/api/core/gamification/:path*/`,
      },
      {
        source: '/api/gamification/:path*',
        destination: `${apiUrl}/api/core/gamification/:path*/`,
      },
      {
        source: '/api/subscriptions/:path*/',
        destination: `${apiUrl}/api/core/subscriptions/:path*/`,
      },
      {
        source: '/api/subscriptions/:path*',
        destination: `${apiUrl}/api/core/subscriptions/:path*/`,
      },
      {
        source: '/api/notifications/:path*/',
        destination: `${apiUrl}/api/core/notifications/:path*/`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${apiUrl}/api/core/notifications/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`, // Proxy media to Nginx
      }
    ];
  },
};

export default nextConfig;

