/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    // pg はサーバーサイドでのみ使用（クライアントバンドルから除外）
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        dns: false,
        net: false,
        tls: false,
        pg: false,
        'pg-native': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
