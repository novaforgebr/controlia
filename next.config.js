/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar arquivos do Supabase Edge Functions (Deno)
  webpack: (config) => {
    config.externals = config.externals || []
    config.externals.push({
      'supabase/functions': 'commonjs supabase/functions',
    })
    return config
  },
  // Ignorar arquivos .ts do Supabase Functions durante a compilação
  typescript: {
    ignoreBuildErrors: false,
  },
  // Otimizações de performance
  compress: true,
  poweredByHeader: false,
  // Suporte a React 19
  reactStrictMode: true,
}

module.exports = nextConfig

