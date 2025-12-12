/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // API routes are now handled by Next.js API routes (app/api/*)
  // Proxy missing volunteer routes to backend
  async rewrites() {
    return [
      {
        source: '/api/volunteers/:path*',
        destination: 'http://localhost:5000/api/volunteers/:path*',
      },
      {
        source: '/api/transactions/:path*',
        destination: 'http://localhost:5000/api/transactions/:path*',
      },
    ]
  },
}

export default nextConfig
