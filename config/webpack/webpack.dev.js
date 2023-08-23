"use strict";

const paths = require("../paths");
const { getClientEnvironment, getAlias } = require("../env");

const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { merge } = require("webpack-merge");

const env = getClientEnvironment();

const {
  raw: { productConfig = {} },
} = env;

const { appName, webpackConfig = {}, layout = {} } = productConfig;
const { privateConfig, publicUrlOrPath, devServer, ...restConfig } =
  webpackConfig;
const { headScripts = [], copyOptions } = privateConfig || {};

module.exports = merge(
  {
    mode: "development",
    bail: false,
    devtool: "cheap-module-source-map",
    entry: {
      main: paths.appIndexJs,
      // Runtime code for hot module replacement
      // hot: "webpack/hot/dev-server.js",
      // Dev server client for web socket transport, hot and live reload logic
      // client: "webpack-dev-server/client/index.js?hot=true&live-reload=true",
    },
    output: {
      pathinfo: false,
      path: paths.appBuild,
      filename: "[name].js",
      chunkFilename: "[name].chunk.js",
      publicPath: "/", // paths.publicUrlOrPath,
      // assetModuleFilename: "[name][ext]",
      devtoolModuleFilenameTemplate: (info) =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
      // clean: true,
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: paths.appHtml,
        inject: true,
        favicon: `${paths.appPublic}/favicon.ico`,
        headScripts: headScripts,
        appName: appName ? appName : "root",
        defaultTitle: layout.title,
      }),
      new webpack.DefinePlugin(env.stringified),
      new webpack.ProvidePlugin({
        // process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      copyOptions && new CopyPlugin(copyOptions),
      new CaseSensitivePathsPlugin(),
      new ForkTsCheckerWebpackPlugin(),
      new FriendlyErrorsWebpackPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    optimization: {
      minimize: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
      runtimeChunk: "single",
    },
    resolve: {
      extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
      alias: getAlias(),
      fallback: {
        // "stream": require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      },
    },
    performance: false,
    module: {
      strictExportPresence: true,
      rules: [
        {
          oneOf: [
            {
              test: /\.(js|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve("babel-loader"),
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      useBuiltIns: "entry",
                      corejs: 3,
                    },
                  ],
                  [
                    "@babel/preset-react",
                    {
                      development: true,
                      useBuiltIns: true,
                      runtime: "automatic",
                    },
                  ],
                  "@babel/preset-typescript",
                ].filter(Boolean),
                plugins: [
                  ["@babel/plugin-proposal-decorators", { legacy: true }],
                  [
                    require("@babel/plugin-transform-runtime"),
                    {
                      corejs: false,
                      helpers: true,
                      version: require("@babel/runtime-corejs3/package.json")
                        .version,
                      regenerator: true,
                    },
                  ],
                  [
                    require("babel-plugin-transform-react-remove-prop-types")
                      .default,
                    {
                      removeImport: true,
                    },
                  ],
                  require.resolve("react-refresh/babel"),
                ].filter(Boolean),
              },
            },
            {
              test: /\.m?js/,
              include: /node_modules/,
              resolve: {
                fullySpecified: false,
              },
            },
            {
              test: /\.(less|css)$/,
              include: /src/,
              use: [
                {
                  loader: require.resolve("style-loader"),
                  options: {
                    esModule: true,
                  },
                },
                {
                  loader: require.resolve("css-loader"),
                  options: {
                    importLoaders: 2,
                    esModule: true,
                    modules: {
                      namedExport: true,
                      localIdentName: "[local]",
                    },
                  },
                },
                {
                  loader: require.resolve("postcss-loader"),
                  options: {
                    postcssOptions: {
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
                },
                {
                  loader: require.resolve("less-loader"),
                  options: {
                    lessOptions: {
                      javascriptEnabled: true,
                    },
                  },
                },
              ],
              sideEffects: true,
            },
            {
              test: /\.svg$/i,
              issuer: /\.[jt]sx?$/,
              type: "javascript/auto",
              use: ["@svgr/webpack", "url-loader"],
            },
            {
              test: /\.(png|jpg|jpeg|gif)$/,
              type: "asset/resource",
            },
          ],
        },
      ],
    },
  },
  restConfig
);
