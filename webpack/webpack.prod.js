const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    // We no not want to minimize our code.
    minimize: false,
  },
});
