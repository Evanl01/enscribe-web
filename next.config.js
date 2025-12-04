/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Remove server-side features for static export
  experimental: {
    esmExternals: true
  },
  reactCompiler: true,
  
  // Add rewrites for development to proxy API calls
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://emscribe.vercel.app/api/:path*'
        }
      ];
    }
    return [];
  }
}

module.exports = nextConfig