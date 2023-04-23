"use strict";

const paths = require("../paths");
// const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

const env = getClientEnvironment();

const {
  raw: { productConfig = {} },
} = env;
const { appName, webpackConfig = {}, layout = {} } = productConfig;
const { headScripts = [] } = webpackConfig;

const outputlibrary =
  appName && appName != "main"
    ? {
        library: `${appName}`,
        libraryTarget: "umd",
        globalObject: "window",
        // jsonpFunction: `webpackJsonp_doms`,
      }
    : {};
module.exports = {
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
    ...outputlibrary,
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
    // modules: ["node_modules", paths.appNodeModules].concat(
    //   modules.additionalModulePaths || []
    // ),
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
            // include: paths.appPath,
            // exclude: /node_modules/,
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                [
                  require("@babel/preset-env"),
                  {
                    useBuiltIns: "entry",
                    corejs: 3,
                  },
                ],
                [
                  require("@babel/preset-react").default,
                  {
                    development: true,
                    useBuiltIns: true,
                    runtime: "automatic",
                  },
                ],
                [require("@babel/preset-typescript").default],
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
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-proposal-private-methods", { loose: true }],
                [
                  "@babel/plugin-proposal-private-property-in-object",
                  { loose: true },
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
            test: /\.(less|css)$/,
            include: /node_modules/,
            use: [
              {
                loader: "style-loader",
              },
              {
                loader: "css-loader",
              },
              {
                loader: "less-loader",
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
};
