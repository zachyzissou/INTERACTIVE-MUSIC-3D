const path = require('path');

module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'src']
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};
