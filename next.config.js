const path = require('path');

module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  eslint: {
    dirs: ['app', 'src']
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
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source'
    })
    return config;
  },
};
