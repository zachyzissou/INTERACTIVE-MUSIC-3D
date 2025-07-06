const path = require('path');

module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  
  eslint: {
    dirs: ['app', 'src']
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  },
  
  webpack(config, { dev, isServer }) {
    if (!dev) {
      config.devtool = 'source-map'
    }
    
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
      '@lib/logger': path.resolve(
        __dirname,
        isServer ? 'src/lib/logger.server.ts' : 'src/lib/logger.client.ts'
      ),
    };
    
    config.module = config.module || { rules: [] }
    config.module.rules.push({
      test: /\.js\.map$/,
      use: 'null-loader'
    })
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
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
      };
    }
    
    return config;
  },
};
