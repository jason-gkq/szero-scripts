"use strict";

const paths = require("../paths");
const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");

process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
module.exports = {
  mode: "development",
  bail: false,
  devtool: "cheap-module-source-map",
  entry: {
    main: paths.appIndexJs,
  },
  output: {
    pathinfo: true,
    path: paths.appBuild,
    filename: "[name].js",
    chunkFilename: "[name].chunk.js",
    publicPath: paths.publicUrlOrPath,
    devtoolModuleFilenameTemplate: (info) =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
    }),
    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new CaseSensitivePathsPlugin(),
    useTypeScript && new ForkTsCheckerWebpackPlugin(),
    new WebpackManifestPlugin({
      fileName: "asset-manifest.json",
      publicPath: paths.publicUrlOrPath,
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        const entrypointFiles = entrypoints.main.filter(
          (fileName) => !fileName.endsWith(".map")
        );

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    }),
  ].filter(Boolean),
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: "all",
      name: false,
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules].concat(
      modules.additionalModulePaths || []
    ),
    extensions: paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes("ts")),
    alias: getAlias(),
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  node: {
    global: true,
    __filename: true,
    __dirname: true,
  },
  performance: false,
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
                    development: true,
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
                ["@babel/plugin-transform-react-jsx-self"],
                ["@babel/plugin-transform-react-jsx-source"],
                useTypeScript && ["@babel/plugin-transform-typescript"],
                [
                  require("@babel/plugin-transform-flow-strip-types").default,
                  false,
                ],
                require("babel-plugin-macros"),
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
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
                require("@babel/plugin-proposal-optional-chaining").default,
                require("@babel/plugin-proposal-nullish-coalescing-operator")
                  .default,
                require.resolve("react-refresh/babel"),
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
            use: [
              {
                loader: require.resolve("style-loader"),
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
                    strictMath: false,
                    javascriptEnabled: true,
                  },
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(png|jpg|jpeg|gif)$/,
            type: "asset/resource",
          },
          {
            test: /\.svg$/,
            type: "asset/inline",
          },
          {
            test: /\.(pdf|txt)$/,
            type: "asset",
          },
        ],
      },
    ],
  },
};
