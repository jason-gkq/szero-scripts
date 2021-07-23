"use strict";

const paths = require("../paths");
const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const TerserPlugin = require("terser-webpack-plugin");
const MpPlugin = require("mp-webpack-plugin");

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
const swSrc = fs.existsSync(paths.swSrc);

let modifyVars = {};
const { raw } = env;
if (
  raw.productConfig.theme &&
  fs.existsSync(`${paths.appPublic}/themes/${raw.productConfig.theme}.json`)
) {
  modifyVars = require(`${paths.appPublic}/themes/${raw.productConfig.theme}.json`);
}

module.exports = {
  mode: "production",
  bail: true,
  devtool: "source-map",
  entry: {
    index: paths.appMpIndexJs,
  },
  output: {
    path: paths.appBuildMp, // 放到小程序代码目录中的 common 目录下
    filename: "[name].js", // 必需字段，不能修改
    library: "createApp", // 必需字段，不能修改
    libraryExport: "default", // 必需字段，不能修改
    libraryTarget: "window", // 必需字段，不能修改
    hashDigestLength: 8,
    pathinfo: false,
    // publicPath: paths.publicUrlOrPath,
  },
  target: "web", // 必需字段，不能修改
  optimization: {
    runtimeChunk: false, // 必需字段，不能修改
    splitChunks: {
      chunks: "all",
      minSize: 200000, // 最小不小于 200k
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      minChunks: 1,
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        sourceMap: true,
        terserOptions: {
          safari10: false,
          compress: {
            ecma: 5,
            comparisons: false,
            inline: 2,
          },
          keep_classnames: true,
          keep_fnames: true,
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        oneOf: [
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: paths.appPath,
            exclude: /node_modules/,
            loader: require.resolve("babel-loader"),
            options: {
              sourceMaps: true,
              babelrc: false,
              configFile: false,
              cacheDirectory: true,
              cacheCompression: false,
              compact: true,
              presets: [
                [
                  require("@babel/preset-env"),
                  {
                    useBuiltIns: "entry",
                    corejs: 3,
                    exclude: ["transform-typeof-symbol"],
                  },
                ],
                [
                  require("@babel/preset-react").default,
                  {
                    development: false,
                    useBuiltIns: true,
                    runtime: "automatic",
                  },
                ],
                useTypeScript && [require("@babel/preset-typescript").default],
              ].filter(Boolean),
              plugins: [
                ["@babel/plugin-syntax-jsx"],
                ["@babel/plugin-transform-react-jsx"],
                ["@babel/plugin-transform-react-display-name"],
                ["add-module-exports"],
                useTypeScript && ["@babel/plugin-transform-typescript"],
                [
                  require("@babel/plugin-transform-flow-strip-types").default,
                  false,
                ],
                require("babel-plugin-macros"),
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-proposal-private-methods", { loose: true }],
                [
                  require("@babel/plugin-transform-runtime"),
                  {
                    corejs: false,
                    helpers: true,
                    version: require("@babel/runtime/package.json").version,
                    regenerator: true,
                    useESModules: true,
                    absoluteRuntime: path.dirname(
                      require.resolve("@babel/runtime/package.json")
                    ),
                  },
                ],
                [
                  require("babel-plugin-transform-react-remove-prop-types")
                    .default,
                  {
                    removeImport: true,
                  },
                ],
                ["@babel/plugin-proposal-export-namespace-from"],
                ["@babel/plugin-proposal-export-default-from"],
                require("@babel/plugin-proposal-optional-chaining").default,
                require("@babel/plugin-proposal-nullish-coalescing-operator")
                  .default,
                [
                  "import",
                  { libraryName: "antd", libraryDirectory: "lib", style: true },
                  "antd",
                ],
                [
                  "import",
                  {
                    libraryName: "antd-mobile",
                    libraryDirectory: "lib",
                    style: true,
                  },
                  "antd-mobile",
                ],
              ].filter(Boolean),
              overrides: [
                {
                  exclude: /\.tsx?$/,
                  plugins: [
                    require("@babel/plugin-transform-flow-strip-types").default,
                  ],
                },
                {
                  test: /\.tsx?$/,
                  plugins: [
                    [
                      require("@babel/plugin-proposal-decorators").default,
                      { legacy: true },
                    ],
                  ],
                },
              ].filter(Boolean),
            },
          },
          {
            test: /\.(js|mjs)$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: require.resolve("babel-loader"),
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              cacheDirectory: true,
              cacheCompression: false,
              sourceMaps: true,
              inputSourceMap: true,
              presets: [
                [
                  require("@babel/preset-env"),
                  {
                    useBuiltIns: "entry",
                    corejs: 3,
                    exclude: ["transform-typeof-symbol"],
                  },
                ],
              ],
              plugins: [
                [
                  require("@babel/plugin-transform-runtime"),
                  {
                    corejs: false,
                    helpers: true,
                    version: require("@babel/runtime/package.json").version,
                    regenerator: true,
                    useESModules: true,
                    absoluteRuntime: path.dirname(
                      require.resolve("@babel/runtime/package.json")
                    ),
                  },
                ],
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
              ].filter(Boolean),
            },
          },
          {
            test: /\.(less|css)$/,
            include: /src/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  esModule: true,
                  modules: {
                    namedExport: true,
                  },
                },
              },
              {
                loader: require.resolve("css-loader"),
                options: {
                  importLoaders: 2,
                  esModule: true,
                  modules: {
                    namedExport: true,
                  },
                },
              },
              {
                loader: require.resolve("postcss-loader"),
                options: {
                  plugins: () => [
                    require("postcss-flexbugs-fixes"),
                    require("postcss-preset-env")({
                      autoprefixer: {
                        flexbox: "no-2009",
                      },
                      stage: 3,
                    }),
                    postcssNormalize(),
                  ],
                },
              },
              {
                loader: "less-loader",
                options: {
                  javascriptEnabled: true,
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(less|css)$/,
            include: /node_modules/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
              },
              {
                loader: "css-loader",
              },
              {
                loader: "less-loader",
                options: {
                  javascriptEnabled: true,
                  modifyVars,
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(png|jpg|gif|svg|jpeg)$/,
            loader: "file-loader",
            options: {
              name: "static/media/[name].[hash:8].[ext]",
            },
          },
          {
            loader: require.resolve("file-loader"),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: "static/media/[name].[hash:8].[ext]",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules].concat(
      modules.additionalModulePaths || []
    ),
    extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
    alias: getAlias(),
    // alias: Object.assign({}, getAlias(), {
    //   react: "react/umd/react.development.js",
    //   "react-dom": "react-dom/umd/react-dom.development.js",
    // }),
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  // @ts-ignore
  plugins: [
    new MpPlugin(require("../miniprogram.config")),
    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    // new webpack.DefinePlugin({
    //   "process.env.isMiniprogram": process.env.isMiniprogram, // 注入环境变量，用于业务代码判断
    // }),
    new MiniCssExtractPlugin({
      filename: "[name].wxss",
    }),
  ],
};
