const path = require('path');

module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'src']
  },
  webpack(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    config.module = config.module || { rules: [] }
    config.module.rules.push({
      test: /\.js\.map$/,
      use: 'null-loader',
    })
    return config
  },
};
