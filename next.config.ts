import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Optimización de imágenes desde Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Logo INPSASEL alojado en Bing CDN
        protocol: 'https',
        hostname: 'tse3.mm.bing.net',
      },
    ],
  },
}

export default nextConfig
