// next.config.js bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  experimental: {
    optimizePackageImports: ['@react-three/drei', '@react-three/fiber'],
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    // Optimize for smaller bundles
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            chunks: 'all',
          },
          audio: {
            test: /[\\/]node_modules[\\/](tone|@magenta)[\\/]/,
            name: 'audio',
            chunks: 'all',
          }
        }
      }
    }

    // Tree shake unused code
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@magenta/music$': '@magenta/music/dist/esm/core.js', // Use smaller core only
      }
    }

    return config
  }
}

module.exports = withBundleAnalyzer(nextConfig)
