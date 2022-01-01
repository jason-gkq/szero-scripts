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
const InterpolateHtmlPlugin = require("../../lib/InterpolateHtmlPlugin");

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

const svgToMiniDataURI = require("mini-svg-data-uri");

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
    path: paths.appBuild,
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
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
      favicon: `${paths.appPublic}/favicon.ico`,
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
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: paths.publicUrlOrPath,
    }),
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
        cache: "../node_modules/.cache/css-minimizer-webpack-plugin",
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
            test: /\.(js|jsx|ts|tsx)$/,
            include: paths.appPath,
            exclude: /node_modules/,
            loader: require.resolve("babel-loader"),
            options: {
              sourceMaps: true,
              // cacheDirectory: true,
              cacheDirectory: "../node_modules/.cache/babel-loader",
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
                [
                  require("@babel/plugin-transform-flow-strip-types").default,
                  false,
                ],
                require("babel-plugin-macros"),
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-proposal-private-methods", { loose: true }],
                [
                  "@babel/plugin-proposal-private-property-in-object",
                  { loose: true },
                ],
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
                    localIdentName: "[local]",
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
                  modifyVars,
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(png|jpg|gif|jpeg)$/,
            use: [
              {
                loader: "url-loader",
                options: {
                  name: "static/media/[name].[hash:8].[ext]",
                  limit: 1024,
                },
              },
              {
                loader: "image-webpack-loader",
                options: {
                  mozjpeg: {
                    progressive: true,
                  },
                  // optipng.enabled: false will disable optipng
                  optipng: {
                    enabled: false,
                  },
                  pngquant: {
                    quality: [0.85, 0.9],
                    speed: 4,
                  },
                  gifsicle: {
                    interlaced: false,
                  },
                  // the webp option will enable WEBP
                  webp: {
                    quality: 90,
                  },
                },
              },
            ],
          },
          {
            test: /\.svg$/i,
            use: [
              {
                loader: "url-loader",
                options: {
                  name: "static/media/[name].[hash:8].[ext]",
                  generator: (content) => svgToMiniDataURI(content.toString()),
                  limit: 1024,
                },
              },
              "svgo-loader",
            ],
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
