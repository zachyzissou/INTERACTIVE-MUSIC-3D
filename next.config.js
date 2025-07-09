const path = require('path');

module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // Disable in production for performance
  
  // Enable experimental features for build optimization
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei', 'tone'],
  },
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: 'text'
      }
    }
  },
  
  eslint: {
    dirs: ['app', 'src']
  },
  
  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
        ]
      }
    ]
  },
  
  webpack(config, { dev, isServer }) {
    // Optimize for production builds
    if (!dev) {
      config.devtool = false; // Disable source maps in production
      
      // Enable aggressive optimizations
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
        usedExports: true,
        providedExports: true
      };
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
    
    config.module = config.module || { rules: [] };
    
    // Add loaders for shader files
    config.module.rules.push(
      {
        test: /\.js\.map$/,
        use: 'null-loader'
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader']
      }
    );
    
    // Enhanced bundle splitting for client-side
    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            priority: 20,
            chunks: 'all',
            enforce: true
          },
          audio: {
            test: /[\\/]node_modules[\\/](tone|@magenta)[\\/]/,
            name: 'audio',
            priority: 15,
            chunks: 'all',
            enforce: true
          },
          ui: {
            test: /[\\/]node_modules[\\/](gsap|framer-motion)[\\/]/,
            name: 'ui',
            priority: 10,
            chunks: 'all',
            enforce: true
          }
        }
      };
    }
    
    return config;
  },
};
