"use strict";

const paths = require("../paths");
const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MpPlugin = require("mp-webpack-plugin");
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";
process.env.isMiniprogram = "true";

const env = getClientEnvironment();
const isOptimize = true;
console.log('main::', paths.appMpIndexJs);

module.exports = {
  mode: "production",
  entry: {
    index: paths.appMpIndexJs,
  },
  output: {
    path: paths.appBuildMp, // 放到小程序代码目录中的 common 目录下
    filename: "[name].js", // 必需字段，不能修改
    library: "createApp", // 必需字段，不能修改
    libraryExport: "default", // 必需字段，不能修改
    libraryTarget: "window", // 必需字段，不能修改
  },
  target: "web", // 必需字段，不能修改
  optimization: {
    runtimeChunk: false, // 必需字段，不能修改
    splitChunks: {
      // 代码分隔配置，不建议修改
      chunks: "all",
      minSize: 1000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 100,
      maxInitialRequests: 100,
      automaticNameDelimiter: "~",
      // name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },

    minimizer: isOptimize
      ? [
          // 压缩CSS
          new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.(css|wxss)$/g,
            cssProcessor: require("cssnano"),
            cssProcessorPluginOptions: {
              preset: [
                "default",
                {
                  discardComments: {
                    removeAll: true,
                  },
                  minifySelectors: false, // 因为 wxss 编译器不支持 .some>:first-child 这样格式的代码，所以暂时禁掉这个
                },
              ],
            },
            canPrint: false,
          }),
          // 压缩 js
          new TerserPlugin({
            test: /\.js(\?.*)?$/i,
            parallel: true,
          }),
        ]
      : [],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.[t|j]sx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]?[hash]",
        },
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".json"],
    alias: {
      react: isOptimize ? "react/index.js" : "react/umd/react.development.js",
      "react-dom": isOptimize
        ? "react-dom/index.js"
        : "react-dom/umd/react-dom.development.js",
    },
  },
  plugins: [
    new MpPlugin(require("../miniprogram.config")),
    new webpack.DefinePlugin({
      "process.env.isMiniprogram": process.env.isMiniprogram, // 注入环境变量，用于业务代码判断
    }),
    new MiniCssExtractPlugin({
      filename: "[name].wxss",
    }),
  ],
};


// module.exports = {
//   mode: "production",
//   bail: true,
//   entry: {
//     main: paths.appMpIndexJs,
//   },
//   target: "web", // 必需字段，不能修改
//   output: {
//     hashDigestLength: 8,
//     pathinfo: false,
//     path: paths.appBuildMp,
//     filename: "[name].js", // 必需字段，不能修改
//     library: "createApp", // 必需字段，不能修改
//     libraryExport: "default", // 必需字段，不能修改
//     libraryTarget: "window", // 必需字段，不能修改
//   },
//   // @ts-ignore
//   plugins: [
//     new MiniCssExtractPlugin({
//       filename: "[name].wxss",
//       ignoreOrder: false, // 忽略有关顺序冲突的警告
//     }),
//     new webpack.DefinePlugin(env.stringified),
//     new MpPlugin(require("../miniprogram.config")),
//   ].filter(Boolean),
//   optimization: {
//     minimize: true,
//     minimizer: [
//       // 压缩CSS
//       new OptimizeCSSAssetsPlugin({
//         assetNameRegExp: /\.(css|wxss)$/g,
//         cssProcessor: require("cssnano"),
//         cssProcessorPluginOptions: {
//           preset: [
//             "default",
//             {
//               discardComments: {
//                 removeAll: true,
//               },
//               minifySelectors: false, // 因为 wxss 编译器不支持 .some>:first-child 这样格式的代码，所以暂时禁掉这个
//             },
//           ],
//         },
//         canPrint: false,
//       }),
//       // 压缩 js
//       new TerserPlugin({
//         test: /\.js(\?.*)?$/i,
//         parallel: true,
//       }),
//     ],
//     splitChunks: {
//       // 代码分隔配置，不建议修改
//       chunks: "all",
//       minSize: 1000,
//       maxSize: 0,
//       minChunks: 1,
//       maxAsyncRequests: 100,
//       maxInitialRequests: 100,
//       automaticNameDelimiter: "~",
//       // name: true,
//       cacheGroups: {
//         vendors: {
//           test: /[\\/]node_modules[\\/]/,
//           priority: -10,
//         },
//         default: {
//           minChunks: 2,
//           priority: -20,
//           reuseExistingChunk: true,
//         },
//       },
//     },
//     runtimeChunk: false,
//   },
//   resolve: {
//     modules: ["node_modules", paths.appNodeModules].concat(
//       modules.additionalModulePaths || []
//     ),
//     extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
//     alias: getAlias(),
//   },
//   performance: false,
//   module: {
//     strictExportPresence: true,
//     rules: [
//       {
//         oneOf: [
//           {
//             test: /\.(js|mjs|jsx|ts|tsx)$/,
//             include: paths.appPath,
//             exclude: /node_modules/,
//             loader: "babel-loader",
//             options: {
//               babelrc: false,
//               configFile: false,
//               cacheDirectory: true,
//               cacheCompression: false,
//               compact: true,
//               presets: [
//                 [
//                   require("@babel/preset-env"),
//                   {
//                     useBuiltIns: "entry",
//                     corejs: 3,
//                     exclude: ["transform-typeof-symbol"],
//                   },
//                 ],
//                 [
//                   require("@babel/preset-react").default,
//                   {
//                     development: false,
//                     useBuiltIns: true,
//                     runtime: "automatic",
//                   },
//                 ],
//               ].filter(Boolean),
//               plugins: [
//                 ["@babel/plugin-syntax-jsx"],
//                 ["@babel/plugin-transform-react-jsx"],
//                 ["@babel/plugin-transform-react-display-name"],
//                 ["babel-plugin-add-module-exports"],
//                 [
//                   require("@babel/plugin-transform-flow-strip-types").default,
//                   false,
//                 ],
//                 require("babel-plugin-macros"),
//                 ["@babel/plugin-proposal-decorators", { legacy: true }],
//                 ["@babel/plugin-proposal-class-properties", { loose: true }],
//                 [
//                   require("@babel/plugin-transform-runtime"),
//                   {
//                     corejs: false,
//                     helpers: true,
//                     version: require("@babel/runtime/package.json").version,
//                     regenerator: true,
//                     useESModules: true,
//                     absoluteRuntime: path.dirname(
//                       require.resolve("@babel/runtime/package.json")
//                     ),
//                   },
//                 ],
//                 [
//                   require("babel-plugin-transform-react-remove-prop-types")
//                     .default,
//                   {
//                     removeImport: true,
//                   },
//                 ],
//                 require("@babel/plugin-proposal-optional-chaining").default,
//                 require("@babel/plugin-proposal-nullish-coalescing-operator")
//                   .default,
//               ].filter(Boolean),
//             },
//           },
//           {
//             test: /\.(less|css)$/,
//             include: /src/,
//             use: [
//               {
//                 loader: MiniCssExtractPlugin.loader,
//                 options: {
//                   esModule: true,
//                   modules: {
//                     namedExport: true,
//                   },
//                 },
//               },
//               {
//                 loader: "css-loader",
//                 options: {
//                   importLoaders: 2,
//                   esModule: true,
//                   modules: {
//                     namedExport: true,
//                   },
//                 },
//               },
//               {
//                 loader: "less-loader",
//                 options: {
//                   lessOptions: {
//                     strictMath: false,
//                     javascriptEnabled: true,
//                   },
//                 },
//               },
//             ],
//             sideEffects: true,
//           },
//           {
//             test: /\.(less|css)$/,
//             include: /node_modules/,
//             use: [
//               {
//                 loader: "style-loader",
//               },
//               {
//                 loader: "css-loader",
//               },
//               {
//                 loader: "less-loader",
//                 options: {
//                   lessOptions: {
//                     strictMath: false,
//                     javascriptEnabled: true,
//                   },
//                 },
//               },
//             ],
//             sideEffects: true,
//           },
//           {
//             test: /\.(png|jpg|gif|svg)$/,
//             loader: "file-loader",
//             options: {
//               name: "[name].[ext]?[hash]",
//             },
//           },
//         ],
//       },
//     ],
//   },
// };
