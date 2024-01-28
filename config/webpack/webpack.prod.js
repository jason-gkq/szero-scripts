'use strict';
import paths, { moduleFileExtensions } from '../paths.js';
import { getClientEnvironment, getAlias } from '../env.js';

// import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import postcssNormalize from 'postcss-normalize';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import InterpolateHtmlPlugin from '../../lib/InterpolateHtmlPlugin.js';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
// import AddAssetHtmlPlugin from 'add-asset-html-webpack-plugin'; // dll 解析
// import WorkboxPlugin from 'workbox-webpack-plugin'; // production
import CopyPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';
import svgToMiniDataURI from 'mini-svg-data-uri';

import { default as corejs3Pkg } from '@babel/runtime-corejs3/package.json' assert { type: 'json' };

const env = getClientEnvironment();
// const swSrc = fs.existsSync(paths.swSrc);

const {
  raw: { productConfig = {} },
} = env;
const { appName, webpackConfig = {}, layout = {} } = productConfig;
const { privateConfig, publicUrlOrPath, devServer, ...restConfig } =
  webpackConfig;
const { headScripts = [], copyOptions } = privateConfig || {};

export default merge(
  {
    mode: 'production',
    bail: true,
    devtool: 'source-map',
    entry: {
      main: paths.appIndexJs,
    },
    output: {
      hashDigestLength: 8,
      pathinfo: false,
      path: paths.appBuild,
      filename: 'static/pages/[name].[contenthash].js',
      chunkFilename: 'static/pages/[name].[contenthash].chunk.js',
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: (info) =>
        path
          .relative(paths.appSrc, info.absoluteResourcePath)
          .replace(/\\/g, '/'),
    },
    // @ts-ignore
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: paths.appHtml,
        inject: true,
        favicon: `${paths.appPublic}/favicon.ico`,
        headScripts: headScripts,
        appName: appName ? appName : 'root',
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
        filename: 'static/pages/[name].[contenthash].css',
        chunkFilename: 'static/pages/[name].[contenthash].chunk.css',
        ignoreOrder: true, // 忽略有关顺序冲突的警告
      }),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
        PUBLIC_URL: paths.publicUrlOrPath,
      }),
      new webpack.DefinePlugin(env.stringified),
      new webpack.ProvidePlugin({
        // process: "process/browser",
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      copyOptions && new CopyPlugin(copyOptions),
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
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        minSize: 500000, // 最小不小于 200k
        maxSize: 3348576,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        minChunks: 1,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            filename: 'static/vendor/[name].[contenthash].chunk.js',
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
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      runtimeChunk: {
        name: (entrypoint) => `runtime~${entrypoint.name}`,
      },
    },
    resolve: {
      extensions: moduleFileExtensions.map((ext) => `.${ext}`),
      alias: getAlias(),
      // fallback: {
      //   // "stream": require.resolve("stream-browserify"),
      //   buffer: require.resolve('buffer/'),
      // },
    },
    performance: {
      hints: 'error',
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
              loader: 'babel-loader',
              options: {
                sourceMaps: true,
                cacheDirectory: true,
                cacheCompression: false,
                compact: true,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      // useBuiltIns: "usage",
                      useBuiltIns: 'entry',
                      corejs: 3,
                    },
                  ],
                  [
                    '@babel/preset-react',
                    {
                      development: false,
                      useBuiltIns: true,
                      runtime: 'automatic',
                    },
                  ],
                  '@babel/preset-typescript',
                ].filter(Boolean),
                plugins: [
                  ['@babel/plugin-proposal-decorators', { legacy: true }],
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      corejs: false,
                      helpers: true,
                      version: corejs3Pkg.version,
                      regenerator: true,
                    },
                  ],
                  [
                    'babel-plugin-transform-react-remove-prop-types',
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
                  loader: 'css-loader',
                  options: {
                    importLoaders: 2,
                    esModule: true,
                    modules: {
                      namedExport: true,
                      localIdentName: '[local]',
                    },
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      plugins: () => [
                        'postcss-flexbugs-fixes',
                        [
                          'postcss-preset-env',
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        postcssNormalize(),
                      ],
                    },
                  },
                },
                {
                  loader: 'less-loader',
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
              test: /\.module\.(less|css)$/,
              include: /src/,
              exclude: /\.lazy\.(less|css)$/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    esModule: true,
                  },
                },
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 2,
                    esModule: true,
                    modules: {
                      namedExport: true,
                      localIdentName: '[local]',
                    },
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      plugins: () => [
                        'postcss-flexbugs-fixes',
                        [
                          'postcss-preset-env',
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        postcssNormalize(),
                      ],
                    },
                  },
                },
                {
                  loader: 'less-loader',
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
              test: /\.lazy\.(less|css)$/,
              include: /src/,
              exclude: /\.module\.(less|css)$/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    esModule: true,
                  },
                },
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 2,
                    esModule: true,
                    modules: {
                      namedExport: true,
                      localIdentName: '[local]',
                    },
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      plugins: () => [
                        'postcss-flexbugs-fixes',
                        [
                          'postcss-preset-env',
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        postcssNormalize(),
                      ],
                    },
                  },
                },
                {
                  loader: 'less-loader',
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
                  loader: 'style-loader', // MiniCssExtractPlugin.loader,
                },
                {
                  loader: 'css-loader',
                },
                {
                  loader: 'less-loader',
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
              type: 'javascript/auto',
              use: [
                '@svgr/webpack',
                {
                  loader: 'url-loader',
                  options: {
                    name: 'static/media/[name].[contenthash:8].svg',
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
              type: 'asset/resource',
              generator: {
                filename: 'static/media/[name].[contenthash][ext]',
              },
            },
          ],
        },
      ],
    },
  },
  restConfig
);
