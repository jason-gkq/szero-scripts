'use strict';

import paths, { moduleFileExtensions } from '../paths.js';
import { getClientEnvironment, getAlias } from '../env.js';

// import fs from 'fs';
import path from 'path';
// import slash from 'slash';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import postcssNormalize from 'postcss-normalize';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
// import AddAssetHtmlPlugin from 'add-asset-html-webpack-plugin'; // dll 解析
import CopyPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';

import { default as corejs3Pkg } from '@babel/runtime-corejs3/package.json' assert { type: 'json' };

const env = getClientEnvironment();

const {
  raw: { productConfig = {} },
} = env;

const { appName, webpackConfig = {}, layout = {} } = productConfig;
const { privateConfig, publicUrlOrPath, devServer, ...restConfig } =
  webpackConfig;
const { headScripts = [], copyOptions } = privateConfig || {};

export default merge(
  {
    mode: 'development',
    bail: false,
    devtool: 'cheap-module-source-map',
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
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      publicPath: '/', // paths.publicUrlOrPath,
      // assetModuleFilename: "[name][ext]",
      devtoolModuleFilenameTemplate: (info) =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
      // clean: true,
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: paths.appHtml,
        inject: true,
        favicon: `${paths.appPublic}/favicon.ico`,
        headScripts: headScripts,
        appName: appName ? appName : 'root',
        defaultTitle: layout.title,
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
      runtimeChunk: 'single',
    },
    resolve: {
      extensions: moduleFileExtensions.map((ext) => `.${ext}`),
      alias: getAlias(),
      // fallback: {
      //   // "stream": require.resolve("stream-browserify"),
      //   buffer: require.resolve('buffer/'),
      // },
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
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      useBuiltIns: 'entry',
                      corejs: 3,
                    },
                  ],
                  [
                    '@babel/preset-react',
                    {
                      development: true,
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
                  'react-refresh/babel',
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
                  loader: 'style-loader',
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
                      plugins: [
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
                  loader: 'style-loader',
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
                      plugins: [
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
                  loader: 'style-loader',
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
                      plugins: [
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
                  loader: 'style-loader',
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
              use: ['@svgr/webpack', 'url-loader'],
            },
            {
              test: /\.(png|jpg|jpeg|gif)$/,
              type: 'asset/resource',
            },
          ],
        },
      ],
    },
  },
  restConfig
);
