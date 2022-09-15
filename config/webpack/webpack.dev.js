"use strict";

const paths = require("../paths");
// const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const PnpWebpackPlugin = require("pnp-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);

const { raw } = env;
let modifyVars = raw.productConfig.layout.modifyVars || {};

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
    assetModuleFilename: "[name][ext]",
    devtoolModuleFilenameTemplate: (info) =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
    // clean: true,

    library: `${raw.productConfig.appName}`,
    libraryTarget: "umd",
    globalObject: "window",
    // jsonpFunction: `webpackJsonp_doms`,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
      favicon: `${paths.appPublic}/favicon.ico`,
    }),
    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new ReactRefreshWebpackPlugin(),
    new CaseSensitivePathsPlugin(),
    useTypeScript && new ForkTsCheckerWebpackPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  resolve: {
    // modules: ["node_modules", paths.appNodeModules].concat(
    //   modules.additionalModulePaths || []
    // ),
    extensions: paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes("ts")),
    alias: getAlias(),
  },
  // node: {
  //   global: true,
  //   __filename: true,
  //   __dirname: true,
  // },
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
                useTypeScript && [require("@babel/preset-typescript").default],
              ].filter(Boolean),
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
                [
                  require("babel-plugin-transform-react-remove-prop-types")
                    .default,
                  {
                    removeImport: true,
                  },
                ],
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-proposal-private-methods", { loose: true }],
                [
                  "@babel/plugin-proposal-private-property-in-object",
                  { loose: true },
                ],
                [
                  "import", // babel-plugin-import 需要安装
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
                require.resolve("react-refresh/babel"),
              ].filter(Boolean),
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
                  // modules: {
                  //   namedExport: true,
                  // },
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
                    modifyVars,
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
          // {
          //   test: /\.svg$/i,
          //   type: "asset/inline",
          // },
          {
            test: /\.(png|jpg|gif|jpeg)$/,
            type: "asset/resource",
          },
          {
            exclude: [
              /\.(js|mjs|jsx|ts|tsx|png|jpg|gif|jpeg|svg)$/,
              /\.html$/,
              /\.json$/,
            ],
            type: "asset/resource",
          },
        ],
      },
    ],
  },
};
