const webpack = require("webpack");
const { merge } = require("webpack-merge");
const path = require("path");
const base = require("./webpack.base.js");

function resolve(relatedPath) {
  return path.join(__dirname, relatedPath);
}

module.exports = merge(base, {
  mode: "development",
  // 为了提高本地构建速度，不开启 source-map
  // devtool: 'inline-source-map',
  plugins: [
    // new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    // 定义环境变量为开发环境
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("test"),
      SERVICE_URL: JSON.stringify("https://m.lechebang.cn/"),
    }),
  ],
  // devServer: {
  //   contentBase: resolve("../dist"),
  //   historyApiFallback: false,
  //   // open: true, // 是否每次都打开新页面
  //   hot: true,
  //   host: "localhost",
  //   port: 3200,
  // },
});
