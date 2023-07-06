const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  bail: true,
  devtool: "source-map",
  entry: {
    reactVendor: ["react", "react-dom", "react-router-dom"], // 手动指定打包哪些库
    mobxVendor: ["mobx", "mobx-react-lite", "react-router-dom"],
    antdVendor: ["antd", "@ant-design/cssinjs"],
    antdIconsVendor: ["@ant-design/icons"],
    antdProVendor: ["@ant-design/pro-components"],
    // antdMobileVendor: ["antd-mobile", "antd-mobile-icons"],
    // pcVendor: [
    //   "@szero/cache",
    //   "@szero/hooks",
    //   "@szero/navigate",
    //   "@szero/net",
    //   "@szero/utils",
    //   "@szero/pc",
    //   "axios",
    // ],
    // mobileVendor: [
    //   "@szero/cache",
    //   "@szero/hooks",
    //   "@szero/navigate",
    //   "@szero/net",
    //   "@szero/utils",
    //   "@szero/mobile",
    //   "axios",
    // ],
  },
  output: {
    hashDigestLength: 8,
    pathinfo: false,
    filename: "[name].[contenthash].dll.js",
    path: path.resolve(__dirname, "../../dll"),
    library: "[name]_[fullhash]",
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, "../../dll/[name]-manifest.json"), // 生成对应的manifest.json，给webpack打包用
      context: __dirname, // 必填，不然在web网页中找不到 '_dll_[name]'，会报错  上下文环境路径（必填，为了与DllReferencePlugin存在与同一上下文中）
      name: "[name]_[fullhash]", // manifest 中引用名字格式，不能采用中横线
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
