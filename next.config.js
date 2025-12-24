/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions agora são estáveis no Next.js 15, não precisam mais de experimental
  serverActions: {
    bodySizeLimit: '2mb',
  },
  // Otimizações de performance
  compress: true,
  poweredByHeader: false,
  // Suporte a React 19
  reactStrictMode: true,
}

module.exports = nextConfig

