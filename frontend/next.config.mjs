/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // API routes are now handled by Next.js API routes (app/api/*)
  // No need for rewrites to external backend
}

export default nextConfig
