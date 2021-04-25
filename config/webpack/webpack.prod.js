"use strict";

const paths = require("../paths");
const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
const swSrc = fs.existsSync(paths.swSrc);

module.exports = {
  mode: "production",
  bail: true,
  devtool: "source-map",
  entry: {
    main: paths.appIndexJs,
  },
  output: {
    hashDigestLength: 8,
    pathinfo: false,
    path: paths.appBuildWeb,
    filename: "static/[name]/[name].[contenthash].js",
    chunkFilename: "static/[name]/[name].[contenthash].chunk.js",
    publicPath: paths.publicUrlOrPath,
    devtoolModuleFilenameTemplate: (info) =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, "/"),
  },
  // @ts-ignore
  plugins: [
    new CleanWebpackPlugin(),
    // new CleanWebpackPlugin(['dist'], {
    //   root:     path.resolve(__dirname, '..'),
    //   exclude:  ['manifest.json'],
    //   verbose:  true,
    //   dry:      false
    // }),
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
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
      filename: "static/[name]/[name].[contenthash].css",
      chunkFilename: "static/[name]/[name].[contenthash].chunk.css",
      ignoreOrder: false, // 忽略有关顺序冲突的警告
    }),
    // new webpack.ProvidePlugin({
    //   _: 'lodash',
    //   join: ['lodash', 'join'],
    //  }),
    // new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
    // new InterpolateHtmlPlugin(HtmlWebpackPlugin, {}),
    // new ModuleNotFoundPlugin(path.resolve(__dirname, '..')),

    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new AddAssetHtmlPlugin([
      {
        filepath: `${paths.dllsPath}/*.dll.js`,
        publicPath: `${paths.publicUrlOrPath}static/dll`,
        outputPath: "static/dll",
      },
    ]), // 把dll.js加进index.html里，并且拷贝文件到dist目录
    new webpack.DllReferencePlugin({
      // context: __dirname, // 与DllPlugin中的那个context保持一致
      /** 
          下面这个地址对应webpack.dll.config.js中生成的那个json文件的路径
          这样webpack打包时，会检测此文件中的映射，不会把存在映射的包打包进bundle.js
      **/
      manifest: `${paths.dllsPath}/reactvendors-manifest.json`, // 读取dll打包后的manifest.json，分析哪些代码跳过
    }),
    new webpack.DllReferencePlugin({
      // context: __dirname, // 与DllPlugin中的那个context保持一致
      manifest: `${paths.dllsPath}/reduxvendors-manifest.json`, // 读取dll打包后的manifest.json，分析哪些代码跳过
    }),
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
    swSrc &&
      new WorkboxPlugin.GenerateSW({
        // 这些选项帮助快速启用 ServiceWorkers
        // 不允许遗留任何“旧的” ServiceWorkers
        clientsClaim: true,
        skipWaiting: true,
      }),
    useTypeScript && new ForkTsCheckerWebpackPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
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
  performance: {
    hints: "error",
    maxEntrypointSize: 4000000,
    maxAssetSize: 3348576,
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
};
