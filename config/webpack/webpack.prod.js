"use strict";

const paths = require("../paths");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
// const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin"); // dll 解析
const InterpolateHtmlPlugin = require("../../lib/InterpolateHtmlPlugin");
// const WorkboxPlugin = require("workbox-webpack-plugin"); // production
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { merge } = require("webpack-merge");

const env = getClientEnvironment();
const swSrc = fs.existsSync(paths.swSrc);

const {
  raw: { productConfig = {} },
} = env;
const { appName, webpackConfig = {}, layout = {} } = productConfig;
const { privateConfig, publicUrlOrPath, devServer, ...restConfig } =
  webpackConfig;
const { headScripts = [], copyOptions } = privateConfig || {};

const svgToMiniDataURI = require("mini-svg-data-uri");

module.exports = merge(
  {
    mode: "production",
    bail: true,
    devtool: "source-map",
    entry: {
      main: paths.appIndexJs,
    },
    output: {
      hashDigestLength: 8,
      pathinfo: false,
      path: paths.appBuild,
      filename: "static/pages/[name].[contenthash].js",
      chunkFilename: "static/pages/[name].[contenthash].chunk.js",
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: (info) =>
        path
          .relative(paths.appSrc, info.absoluteResourcePath)
          .replace(/\\/g, "/"),
    },
    // @ts-ignore
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: paths.appHtml,
        inject: true,
        favicon: `${paths.appPublic}/favicon.ico`,
        headScripts: headScripts,
        appName: appName ? appName : "root",
        defaultTitle: layout.title,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      new MiniCssExtractPlugin({
        filename: "static/pages/[name].[contenthash].css",
        chunkFilename: "static/pages/[name].[contenthash].chunk.css",
        ignoreOrder: true, // 忽略有关顺序冲突的警告
      }),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
        PUBLIC_URL: paths.publicUrlOrPath,
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
      new FriendlyErrorsWebpackPlugin(),
      new ForkTsCheckerWebpackPlugin(),
    ].filter(Boolean),
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          // minify: TerserPlugin.uglifyJsMinify,
          parallel: true,
          extractComments: false,
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
      splitChunks: {
        chunks: "all",
        minSize: 500000, // 最小不小于 200k
        maxSize: 3348576,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        minChunks: 1,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            filename: "static/vendor/[name].[contenthash].chunk.js",
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
      moduleIds: "deterministic",
      chunkIds: "deterministic",
      runtimeChunk: {
        name: (entrypoint) => `runtime~${entrypoint.name}`,
      },
    },
    resolve: {
      extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
      alias: getAlias(),
      fallback: {
        // "stream": require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      },
    },
    performance: {
      hints: "error",
      maxEntrypointSize: 40000000,
      maxAssetSize: 3348576,
    },
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
                sourceMaps: true,
                cacheDirectory: true,
                cacheCompression: false,
                compact: true,
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      // useBuiltIns: "usage",
                      useBuiltIns: "entry",
                      corejs: 3,
                    },
                  ],
                  [
                    "@babel/preset-react",
                    {
                      development: false,
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
                  loader: MiniCssExtractPlugin.loader,
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
              use: [
                "@svgr/webpack",
                {
                  loader: "url-loader",
                  options: {
                    name: "static/media/[name].[contenthash:8].svg",
                    generator: (content) =>
                      svgToMiniDataURI(content.toString()),
                    limit: 8 * 1024,
                  },
                },
              ],
            },
            // {
            //   test: /\.svg$/i,
            //   type: "asset", // inline
            //   parser: {
            //     dataUrlCondition: {
            //       maxSize: 8 * 1024, // 默认就是8k
            //     },
            //   },
            //   generator: {
            //     filename: "static/media/[name].[contenthash].svg",
            //     dataUrl: (content) => {
            //       // 大于8k的svg独立生成了文件，但是并未压缩 TODO
            //       content = content.toString();
            //       return svgToMiniDataURI(content);
            //     },
            //   },
            // },
            {
              test: /\.(png|jpg|jpeg|gif)$/,
              type: "asset/resource",
              generator: {
                filename: "static/media/[name].[contenthash][ext]",
              },
            },
          ],
        },
      ],
    },
  },
  restConfig
);
