### 开发环境 webpack 打包详解

### 本包开发 dll 打包配置：

```json
"dependencies": {
  "webpack": "^5.31.0",
  "webpack-cli": "^4.6.0",
},
"devDependencies": {
  "react": "^17.0.2",
  "react-dom": "^17.0.2",
  "react-router-dom": "^5.2.0",
  "require": "^2.4.20",
},
```

**注意当调用 ES6 模块的 import() 方法（引入模块）时，必须指向模块的 .default 值，因为它才是 promise 被处理后返回的实际的 module 对象。**

````js
// 统一采用严格模式
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
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // production
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // production
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin"); // production
const TerserPlugin = require("terser-webpack-plugin"); // production webpack5 不需要单独安装
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin"); // ts check
const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin"); // production dll
const WorkboxPlugin = require("workbox-webpack-plugin"); // production

/**
 * const Copy = require('copy-webpack-plugin')
 *
 * 分析代码
 * const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
 *
 * plugins: [
 *  new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
 * new Copy([
 *    { from: './app/resource/dll', to: '../dist/resource/dll' },
 *  ]),
 * ]
 */

const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin"); // development
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin"); // development

// 声明编译环境
process.env.BABEL_ENV = "development"; // [development | production]
// 声明node环境
process.env.NODE_ENV = "development"; // [development | production]

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
module.exports = {
  mode: "development", // [development | production]
  /**
   * 在第一个错误出现时抛出失败结果，而不是容忍它。默认情况下，当使用 HMR 时，webpack 会将在终端以及浏览器控制台中，以红色文字记录这些错误，但仍然继续进行打包。要启用它：
   */
  bail: false,
  /**
   * 配置中的sourceMap 均可以不配置，采用依赖 devtool 的方式，比较简单好改
   */
  devtool: "cheap-module-source-map", // [cheap-module-source-map | source-map]
  entry: {
    main: paths.appIndexJs,
  },
  output: {
    /**
     * 此设置为设定文件命中hash长度，如果觉得太长，可以所有的hash长度都采用短长度 8 位
     * 开发环境可以不用设置，生产可以用 8 ，简短一些
     */
    hashDigestLength: 8,
    /**
     * 告知 webpack 在 bundle 中引入「所包含模块信息」的相关注释。此选项在 development 模式时的默认值为 true，而在 production 模式时的默认值为 false。
     * 当值为 'verbose' 时，会显示更多信息，如 export，运行时依赖以及 bailouts。
     *
     * 对于在开发环境(development)下阅读生成代码时，虽然通过这些注释可以提供有用的数据信息，但在生产环境(production)下，不应该使用。
     */
    pathinfo: true,
    path: paths.appBuild,
    /**
     * filename 和 chunkFilename 和打包生产有差异，因为运行在内存中，所以
     * 直接使用名称即可，可以不加路径
     * 生产可以加以区分
     */
    filename: "[name].js",
    chunkFilename: "[name].chunk.js",
    /**
     * 项目请求资源路径
     * 对于按需加载(on-demand-load)或加载外部资源(external resources)（如图片、文件等）来说，output.publicPath 是很重要的选项。
     * 如果指定了一个错误的值，则在加载这些资源时会收到 404 错误。
     *
     * 此选项指定在浏览器中所引用的「此输出目录对应的公开 URL」。
     * 相对 URL(relative URL) 会被相对于 HTML 页面（或 <base> 标签）解析。
     * 相对于服务的 URL(Server-relative URL)，相对于协议的 URL(protocol-relative URL) 或绝对 URL(absolute URL) 也可是可能用到的，或者有时必须用到，
     * 例如：当将资源托管到 CDN 时。
     * publicPath: 'https://cdn.example.com/assets/',
     *
     * 该选项的值是以 runtime(运行时) 或 loader(载入时) 所创建的每个 URL 为前缀。因此，在多数情况下，此选项的值都会以 / 结束
     * // One of the below
     * publicPath: 'auto', // It automatically determines the public path from either `import.meta.url`, `document.currentScript`, `<script />` or `self.location`.
     * publicPath: 'https://cdn.example.com/assets/', // CDN（总是 HTTPS 协议）
     * publicPath: '//cdn.example.com/assets/', // CDN（协议相同）
     * publicPath: '/assets/', // 相对于服务(server-relative)
     * publicPath: 'assets/', // 相对于 HTML 页面
     * publicPath: '../assets/', // 相对于 HTML 页面
     * publicPath: '', // 相对于 HTML 页面（目录相同）
     */
    publicPath: paths.publicUrlOrPath,
    /**
     * 告诉 webpack 在生成的运行时代码中可以使用哪个版本的 ES 特性
     * 以下为默认配置，如无特殊要求【无需配置】
     */
    environment: {
      // The environment supports arrow functions ('() => { ... }').
      arrowFunction: true,
      // The environment supports BigInt as literal (123n).
      bigIntLiteral: false,
      // The environment supports const and let for variable declarations.
      const: true,
      // The environment supports destructuring ('{ a, b } = obj').
      destructuring: true,
      // The environment supports an async import() function to import EcmaScript modules.
      dynamicImport: false,
      // The environment supports 'for of' iteration ('for (const x of array) { ... }').
      forOf: true,
      // The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
      module: false,
    },
    /**
     * 自定义每个 source map 的 sources 数组中使用的名称。
     * 可以通过传递模板字符串(template string)或者函数来完成。例如，当使用 devtool: 'eval'，默认值是：
     * 【无需配置】
     */
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
    // 自动加载模块，而不必到处 import 或 require
    new webpack.ProvidePlugin({
      _: "lodash",
      join: ["lodash", "join"],
    }),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new CaseSensitivePathsPlugin(),
    useTypeScript && new ForkTsCheckerWebpackPlugin(),
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
  ].filter(Boolean),
  optimization: {
    minimize: true,
    minimizer: [
      /**
       * terser
       * https://github.com/terser/terser
       */
      new TerserPlugin({
        // test: /\.js(\?.*)?$/i,
        /**
         * parallel 类型： Boolean|Number 默认值： true
         * 使用多进程并发运行以提高构建速度。 并发运行的默认数量： os.cpus().length - 1
         * 并发运行可以显著提高构建速度，因此强烈建议添加此配置
         * 如果你使用 Circle CI 或任何其他不提供 CPU 实际可用数量的环境，则需要显式设置 CPU 数量，以避免 Error: Call retries were exceeded
         */
        parallel: true,
        /**
         * extractComments
         *
         * 是否将注释剥离到单独的文件中（请参阅详细信息）。
         * 默认情况下，仅剥离 /^\**!|@preserve|@license|@cc_on/i 正则表达式匹配的注释，其余注释会删除。
         * 如果原始文件名为 foo.js ，则注释将存储到 foo.js.LICENSE.txt 。
         * terserOptions.format.comments 选项指定是否保留注释，即可以在剥离其他注释时保留一些注释，甚至保留已剥离的注释
         *
         * 剥离 all 或 some （使用 /^\**!|@preserve|@license|@cc_on/i 正则表达式进行匹配）注释。
         * 也可以是function
         *
         * extractComments: "all",
         * extractComments: /@extract/i,
         */
        extractComments: false,
        terserOptions: {
          ecma: undefined,
          parse: {},
          compress: {},
          mangle: true, // Note `mangle.properties` is `false` by default.
          module: false,
          // Deprecated
          output: null,
          format: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: undefined,
          keep_fnames: false,
          safari10: false,
          // 以下是create app 采用的配置，暂时无研究
          compress: {
            ecma: 5,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
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
              /**
               * 去除注释
               */
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
    /**
     * 默认配置
     * 除了vendor路径，其他也【无需配置】
     */
    splitChunks: {
      automaticNameDelimiter: "~", // 命名分隔符
      /**
       * 拆分 chunk 的名称。设为 false 将保持 chunk 的相同名称，因此不会不必要地更改名称。
       * 这是生产环境下构建的建议值。
       * 【无需配置】
       * 默认由模块名+hash命名，名称相同时多个模块将合并为1个，可以设置为function
       */
      name: false,
      /**
       * 这表明将选择哪些 chunk 进行优化。当提供一个字符串，有效值为 all，async 和 initial。
       * 设置为 all 可能特别强大，因为这意味着 chunk 可以在异步和非异步 chunk 之间共享
       *
       * 共有三个值可选：initial(初始模块)、async(按需加载模块)和all(全部模块)
       * ***如果设置为all，会为每一个页面生成一个chunks文件，导致入口加载太多小文件建议不要配置***
       */
      chunks: "async",
      minSize: 20000, // 生成 chunk 的最小体积（以 bytes 为单位）, 模块超过20k自动被抽离成公共模块
      maxSize: 3348576, // 最大不超过3M【4 vs 5】4上面不能配置此参数
      /**
       * 在 webpack 5 中引入了 splitChunks.minRemainingSize 选项，通过确保拆分后剩余的最小 chunk 体积超过限制来避免大小为零的模块。
       * 'development' 模式 中默认为 0。对于其他情况，splitChunks.minRemainingSize 默认为 splitChunks.minSize 的值，因此除需要深度控制的极少数情况外，不需要手动指定它。
       */
      minRemainingSize: 0,
      minChunks: 1, // 拆分前必须共享模块的最小 chunks 数,模块被引用>=1次，便分割
      maxAsyncRequests: 30, // 按需加载时的最大并行请求数
      maxInitialRequests: 30, // 入口点的最大并行请求数
      enforceSizeThreshold: 50000, // 强制执行拆分的体积阈值和其他限制（minRemainingSize，maxAsyncRequests，maxInitialRequests）将被忽略。
      /**
       * 缓存组可以继承和/或覆盖来自 splitChunks.* 的任何选项。
       * 但是 test、priority 和 reuseExistingChunk 只能在缓存组级别上进行配置。将它们设置为 false以禁用任何默认缓存组。
       *
       * priority
       * 一个模块可以属于多个缓存组。优化将优先考虑具有更高 priority（优先级）的缓存组。默认组的优先级为负，以允许自定义组获得更高的优先级（自定义组的默认值为 0）
       *
       * reuseExistingChunk
       * 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块。这可能会影响 chunk 的结果文件名
       *
       * test
       * 控制此缓存组选择的模块。省略它会选择所有模块。它可以匹配绝对模块资源路径或 chunk 名称。匹配 chunk 名称时，将选择 chunk 中的所有模块。
       *
       * filename
       * 仅在初始 chunk 时才允许覆盖文件名。 也可以在 output.filename 中使用所有占位符
       * 也可以在 splitChunks.filename 中全局设置此选项，但是不建议这样做，如果 splitChunks.chunks 未设置为 'initial'，则可能会导致错误。避免全局设置
       */
      cacheGroups: {
        default: {
          // 模块缓存规则，设置为false，默认缓存组将禁用
          minChunks: 2, // 模块被引用>=2次，拆分至vendors公共模块
          priority: -20, // 优先级
          reuseExistingChunk: true, // 默认使用已有的模块
        },
        vendor: {
          // 过滤需要打入的模块
          // test: module => {
          //   if (module.resource) {
          //     const include = [/[\\/]node_modules[\\/]/].every(reg => {
          //       return reg.test(module.resource);
          //     });
          //     const exclude = [/[\\/]node_modules[\\/](react|redux|antd|react-dom|react-router)/].some(reg => {
          //       return reg.test(module.resource);
          //     });
          //     return include && !exclude;
          //   }
          //   return false;
          // },
          test: /[\\/]node_modules[\\/]/,
          // name: 'vendor',
          filename: "vendor/[name].[contenthash].chunk.js", // 【4 vs 5】5配置 4不能配置
          // minChunks: 1,
          priority: -10, // 确定模块打入的优先级
          reuseExistingChunk: true, // 使用复用已经存在的模块
          enforce: true,
        },
        //  antd: {
        //    test: /[\\/]node_modules[\\/]antd/,
        //    name: 'antd',
        //    priority: 15,
        //    reuseExistingChunk: true,
        //  },
        echarts: {
          test: /[\\/]node_modules[\\/]echarts/,
          name: "echarts",
          priority: 16,
          reuseExistingChunk: true,
        },
        "draft-js": {
          test: /[\\/]node_modules[\\/]draft-js/,
          name: "draft-js",
          priority: 18,
          reuseExistingChunk: true,
        },
      },
    },
    /**
     * 告知 webpack 当选择模块 id 时需要使用哪种算法。
     * 将 optimization.moduleIds 设置为 false 会告知 webpack 没有任何内置的算法会被使用，但自定义的算法会由插件提供。
     *
     * deterministic 选项有益于长期缓存，但对比于 hashed 来说，它会导致更小的文件 bundles。
     * 数字值的长度会被选作用于填满最多 80%的 id 空间。 当 optimization.moduleIds 被设置成 deterministic，默认最小 3 位数字会被使用。
     * 要覆盖默认行为，要将 optimization.moduleIds 设置成 false， 并且要使用 webpack.ids.DeterministicModuleIdsPlugin。
     *
     * 【webpack4 暂不支持，兼容小程序打包，暂时去掉】
     * 【4 vs 5】4版本没有此两个节点
     */
    moduleIds: "deterministic",
    chunkIds: "deterministic",
    /**
     * 如果 chunk 为空，告知 webpack 检测或移除这些 chunk。将 optimization.removeEmptyChunks 设置为 false 以禁用这项优化。
     * 【无需配置】
     */
    removeEmptyChunks: true,
    /**
     * runtimeChunk
     * 将 optimization.runtimeChunk 设置为 true 或 'multiple'，会为每个入口添加一个只含有 runtime 的额外 chunk。
     *
     * 对于每个 runtime chunk，导入的模块会被分别初始化，因此如果你在同一个页面中引用多个入口起点，请注意此行为。
     * 你或许应该将其设置为 single，或者使用其他只有一个 runtime 实例的配置。
     * 【小心配置】
     */
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  },
  resolve: {
    // symlinks: false,
    modules: ["node_modules", paths.appNodeModules].concat(
      modules.additionalModulePaths || []
    ),
    extensions: paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes("ts")),
    // 创建 import 或 require 的别名，来确保模块引入变得更简单。例如，一些位于 src/ 文件夹下的常用模块：
    alias: getAlias(),
    plugins: [PnpWebpackPlugin],
    byDependency: {
      // 更多的配置项可以在这里找到 https://webpack.js.org/configuration/resolve/
      less: {
        mainFiles: ["custom"],
      },
    },
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  /**
   * 这些选项可以配置是否 polyfill 或 mock 某些 Node.js 全局变量
   */
  node: {
    /**
     * true: 提供 polyfill.
     * false: 不提供任何 polyfill。代码可能会出现 ReferenceError 的崩溃。
     */
    global: false,
    __filename: false,
    __dirname: false,
  },
  /**
   * 这些选项可以控制 webpack 如何通知「资源(asset)和入口起点超过指定文件限制」。
   * 此功能受到 webpack 性能评估的启发。
   *
   * 配置如何展示性能提示。例如，如果一个资源超过 250kb，webpack 会对此输出一个警告来通知你。
   *
   * hints
   * 打开/关闭提示。此外，当找到提示时，告诉 webpack 抛出一个错误或警告。此属性默认设置为 "warning"。
   * 将展示一条错误，通知你这是体积大的资源。在生产环境构建时，我们推荐使用 hints: "error"，有助于防止把体积巨大的 bundle 部署到生产环境，从而影响网页的性能。
   *
   * maxEntrypointSize: 400000,
   * 入口起点表示针对指定的入口，对于所有资源，要充分利用初始加载时(initial load time)期间。此选项根据入口起点的最大体积，控制 webpack 何时生成性能提示
   *
   * maxAssetSize: 100000,
   * 资源(asset)是从 webpack 生成的任何文件。此选项根据单个资源体积(单位: bytes)，控制 webpack 何时生成性能提示。
   * 生产环境可以适当打开【【需要配置】】
   */
  performance: false,
  /**
   * externals 配置选项提供了「从输出的 bundle 中排除依赖」的方法。
   * 相反，所创建的 bundle 依赖于那些存在于用户环境(consumer's environment)中的依赖。
   * 此功能通常对 library 开发人员来说是最有用的，然而也会有各种各样的应用程序用到它。
   *
   * 防止将某些 import 的包(package)打包到 bundle 中，而是在运行时(runtime)再去从外部获取这些扩展依赖(external dependencies)。
   * 例如，从 CDN 引入 jQuery，而不是把它打包:
   * import $ from 'jquery';
   * $('.my-element').animate(/* ... *\/)
   *
   * externals: /^(jquery|\$)$/i,
   * 匹配给定正则表达式的每个依赖，都将从输出 bundle 中排除
   *
   * 混用语法
   * externals: [
   *  {
   *    // 字符串
   *    react: 'react',
   *    // 对象
   *    lodash: {
   *      commonjs: 'lodash',
   *      amd: 'lodash',
   *      root: '_', // indicates global variable
   *    },
   *    // 字符串数组
   *    subtract: ['./math', 'subtract'],
   *  },
   *  // 函数
   *  function ({ context, request }, callback) {
   *    if (/^yourregex$/.test(request)) {
   *      return callback(null, 'commonjs ' + request);
   *    }
   *    callback();
   *  },
   *  // 正则表达式
   *  /^(jquery|\$)$/i,
   * ],
   *
   * 从 CDN 加载 lodash：
   * externalsType: 'script',
   * externals: {
   *   lodash: [
   *     'https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js',
   *     '_',
   *     'head',
   *   ],
   * },
   * 当你 import 'loadsh' 时，局部变量 head 和全局变量 window._ 都会被暴露：
   * import head from 'lodash';
   * console.log(head([1, 2, 3])); // logs 1 here
   * console.log(window._.head(['a', 'b'])); // logs a here
   * 当加载带有 HTML <script> 标签的代码时，webpack 的 runtime 将试图寻找一个已经存在的 <script> 标签，
   * 此标签需与 src 的属性相匹配，或者具有特定的 data-webpack 属性。
   * 对于 chunk 加载来说，data-webpack 属性的值为 '[output.uniqueName]:chunk-[chunkId]'，而 external 脚本的值为 '[output.uniqueName]:[global]'。
   */
  externals: {
    jquery: "jQuery",
  },
  module: {
    generator: {},
    /**
     * 防止 webpack 解析那些任何与给定正则表达式相匹配的文件。
     * 忽略的文件中 不应该含有 import, require, define 的调用，或任何其他导入机制。
     * 忽略大型的 library 可以提高构建性能
     * 例如：
     *  noParse: /jquery|lodash/,
     *  noParse: (content) => /jquery|lodash/.test(content),
     */
    noParse: /jquery|lodash/,
    /**
     * 缓存模块请求的解析。
     * - 如果 cache 未被启用，则默认值为 false
     * - 如果 cache 被启用，并且此模块的来自 node_modules，则值为 true，否则为 false
     */
    unsafeCache: true,
    /**
     * parser
     * 【无需配置】
     */
    parser: {
      asset: {
        // Parser options for asset modules
      },
      "asset/inline": {
        // No parser options are supported for this module type yet
      },
      "asset/resource": {
        // ditto
      },
      "asset/source": {
        // ditto
      },
      /**
       * JavaScript parser 的配置项。
       */
      javascript: {
        // Parser options for javascript modules
        // e.g, enable parsing of require.ensure syntax
        requireEnsure: true,
        // 为 CommonJS 启用 魔法注释。
        // 请注意，目前只支持 webpackIgnore 注释：const x = require(/* webpackIgnore: true */ 'x');
        commonjsMagicComments: true,
        /**
         * 启用 new URL() 语法解析。
         * 自 webpack 5.23.0 起，module.parser.javascript.url 的 'relative' 值可用。
         * 当使用 'relative' 时，webpack 将为 new URL() 语法生成相对的 URL，即结果 URL 中不包含根 URL
         * <!-- with 'relative' --> <img src='c43188443804f1b1f534.svg' />
         * <!-- without 'relative' --> <img src='file:///path/to/project/dist/c43188443804f1b1f534.svg' />
         * - 当服务器不知道根 URL 时，这对 SSR（服务端渲染）很有用（而且可用节省一些字节）。为了使其相同，它也必须用于客户端构建
         * - 这也适用于 SSG（静态网站生成器），mini-css-plugin 和 html-plugin 等通常需要进行服务端渲染。
         */
        url: true,
      },
      "javascript/auto": {
        // ditto
      },
      "javascript/dynamic": {
        // ditto
      },
      "javascript/esm": {
        // ditto
      },
      // others…
    },
    /**
     * strictExportPresence 将缺失的导出提示成错误而不是警告 since webpack 2.3.0
     */
    strictExportPresence: true,
    /**
     * 每个规则可以分为三部分 - 条件(condition)，结果(result)和嵌套规则(nested rule)
     * 条件有两种输入值：
     * - resource：资源文件的绝对路径。它已经根据 resolve 规则解析
     * - issuer: 请求者的文件绝对路径。是导入时的位置
     * 例如： 从 app.js 导入 './style.css'，resource 是 /path/to/style.css. issuer 是 /path/to/app.js。
     * 在规则中，属性 test, include, exclude 和 resource 对 resource 匹配，并且属性 issuer 对 issuer 匹配
     * 当使用多个条件时，所有条件都匹配。
     * *** 小心！resource 是文件的 解析 路径，这意味着符号链接的资源是真正的路径，而不是 符号链接位置。
     *    在使用工具来符号链接包的时候（如 npm link）比较好记，像 /node_modules/ 等常见条件可能会不小心错过符号链接的文件。
     *    注意，可以通过 resolve.symlinks 关闭符号链接解析（以便将资源解析为符号链接路径） ***
     *
     * 可以使用属性 rules 和 oneOf 指定嵌套规则。
     * 这些规则用于在规则条件(rule condition)匹配时进行取值。每个嵌套规则包含它自己的条件。
     * 被解析的顺序基于以下规则：
     * 1. 父规则
     * 2. rules
     * 3. oneOf
     */
    rules: [
      /**
       * enforce: "pre" | "post" 【无需配置】
       * 指定 loader 种类。没有值表示是普通 loader
       * 还有一个额外的种类"行内 loader"，loader 被应用在 import/require 行内。
       *
       * 所有一个接一个地进入的 loader，都有两个阶段：
       * 1. Pitching 阶段: loader 上的 pitch 方法，按照 后置(post)、行内(inline)、普通(normal)、前置(pre) 的顺序调用。更多详细信息，请查看 Pitching Loader。
       * 2. Normal 阶段: loader 上的 常规方法，按照 前置(pre)、普通(normal)、行内(inline)、后置(post) 的顺序调用。模块源码的转换， 发生在这个阶段。
       * - 所有普通 loader 可以通过在请求中加上 ! 前缀来忽略（覆盖）
       * - 所有普通和前置 loader 可以通过在请求中加上 -! 前缀来忽略（覆盖）
       * - 所有普通，后置和前置 loader 可以通过在请求中加上 !! 前缀来忽略（覆盖）
       * 例如：
       * // 禁用普通 loaders
       * import { a } from '!./file1.js';
       *
       * // 禁用前置和普通 loaders
       * import { b } from  '-!./file2.js';
       *
       * // 禁用所有的 laoders
       * import { c } from  '!!./file3.js';
       *
       *
       * exclude:
       * 排除所有符合条件的模块
       *
       * include
       * 引入符合以下任何条件的模块
       *
       * loader
       * Rule.loader 是 Rule.use: [ { loader } ] 的简写
       *
       * loaders 【无需配置】
       * *** 由于需要支持 Rule.use，此选项 已废弃。 ***
       * Rule.loaders 是 Rule.use 的别名。
       *
       * oneOf
       * 规则数组，当规则匹配时，只使用第一个匹配规则
       *
       * parser 【无需配置】
       * 解析选项对象。所有应用的解析选项都将合并
       * 解析器(parser)可以查阅这些选项，并相应地禁用或重新配置。大多数默认插件， 会如下解释值：
       * - 将选项设置为 false，将禁用解析器。
       * - 将选项设置为 true，或不修改将其保留为 undefined，可以启用解析器
       *
       * 然而，一些解析器(parser)插件可能不光只接收一个布尔值。
       * 例如，内部的 NodeStuffPlugin 插件，可以接收一个对象，而不是 true， 来为特定的规则添加额外的选项
       * 示例（默认的插件解析器选项）：
       * rules: [
       * {
       *   //【无需配置】
       *   parser: {
       *     amd: false, // 禁用 AMD
       *     commonjs: false, // 禁用 CommonJS
       *     system: false, // 禁用 SystemJS
       *     harmony: false, // 禁用 ES2015 Harmony import/export
       *     requireInclude: false, // 禁用 require.include
       *     requireEnsure: false, // 禁用 require.ensure
       *     requireContext: false, // 禁用 require.context
       *     browserify: false, // 禁用特殊处理的 browserify bundle
       *     requireJs: false, // 禁用 requirejs.*
       *     node: false, // 禁用 __dirname, __filename, module, require.extensions, require.main, 等。
       *     node: {...}, // 在模块级别(module level)上重新配置 [node](/configuration/node) 层(layer)
       *     worker: ["default from web-worker", "..."] // 自定义 WebWorker 对 JavaScript 的处理，其中 "..." 为默认值。
       *     // 如果一个模块源码大小小于 maxSize，那么模块会被作为一个 Base64 编码的字符串注入到包中， 否则模块文件会被生成到输出的目标目录中。
       *     dataUrlCondition: {
       *        maxSize: 4 * 1024,
       *     },
       *     // 当提供函数时，返回 true 值时告知 webpack 将模块作为一个 Base64 编码的字符串注入到包中， 否则模块文件会被生成到输出的目标目录中
       *     dataUrlCondition: (source, { filename, module }) => {
       *        const content = source.toString();
       *        return content.includes('some marker');
       *     },
       *   }
       * }
       * ]
       *
       * 如果 Rule.type 被设置成 'json'，那么 Rules.parser.parse 选择可能会是一个方法，该方法实现自定义的逻辑，以解析模块的源和并将它转换成 JavaScript 对象。
       * 它可能在没有特定加载器的时候，对将 toml, yaml 和其它非JSON文件导入成导入非常有用：
       *
       * sideEffects
       * 表明模块的哪一部份包含副作用
       *
       * test
       *
       * type
       * Rule.type 设置类型用于匹配模块。它防止了 defaultRules 和它们的默认导入行为发生。
       * 例如，如果你想 通过自定义 loader 加载一个 .json 文件，你会需要将 type 设置为 javascript/auto 以绕过 webpack 内置的 json 导入
       * 可设置值:
       * 'javascript/auto' | 'javascript/dynamic' | 'javascript/esm' | 'json' |
       * 'webassembly/sync' | 'webassembly/async' | 'asset' | 'asset/source' | 'asset/resource' | 'asset/inline'
       *
       *
       * use
       * Rule.use 可以是一个应用于模块的 UseEntries 数组。每个入口(entry)指定使用一个 loader
       * Loaders 可以通过传入多个 loaders 以达到链式调用的效果，它们会从右到左被应用（从最后到最先配置）
       */
      {
        oneOf: [
          /**
           * babel-loader https://babel.docschina.org/
           *
           * 包：
           * @babel/core @babel/cli @babel/preset-env
           * @babel/polyfill  // 缺失特性的修补
           *
           * plugins:
           * @babel/plugin-transform-arrow-functions // 代码中的所有箭头函数（arrow functions）都将被转换为 ES5 兼容的函数表达式
           * @babel/plugin-proposal-decorators：可以在项目中使用装饰器语法。
           * @babel/plugin-proposal-class-properties：可以在项目中使用新的 class 属性语法。
           * @babel/plugin-transform-runtime：使用此插件可以直接使用 babel-runtime 中的代码对 js 文件进行转换，避免代码冗余。
           * @babel/runtime-corejs2：配合 babel-plugin-transform-runtime 插件成对使用
           * @babel/plugin-syntax-dynamic-import：可以在项目中使用 import() 这种语法
           * @babel/plugin-proposal-export-namespace-from：可以使用 export * 这种命名空间的方式导出模块
           * @babel/plugin-proposal-throw-expressions：可以使用异常抛出表达式
           * @babel/plugin-proposal-logical-assignment-operators：可以使用逻辑赋值运算符
           * @babel/plugin-proposal-optional-chaining：可以使用可选链的方式访问深层嵌套的属性或者函数 ?.
           * @babel/plugin-proposal-pipeline-operator：可以使用管道运算符 |>
           * @babel/plugin-proposal-nullish-coalescing-operator：可以使用空值合并语法 ??
           * @babel/plugin-proposal-do-expressions：可以使用 do 表达式（可以认为是三元运算符的复杂版本）
           * @babel/plugin-proposal-function-bind：可以使用功能绑定语法 obj::func
           *
           * presets: [
           *   [
           *     "@babel/preset-env",
           *     {
           *       useBuiltIns: "entry",
           *       // caller.target 等于 webpack 配置的 target 选项
           *       targets: api.caller(caller => caller && caller.target === "node")
           *         ? { node: "current" }
           *         : { chrome: "58", ie: "11" }
           *     }
           *   ],
           *   ["@babel/preset-typescript"],
           *   [
           *     "@babel/preset-react",
           *     {
           *       "pragma": "dom", // default pragma is React.createElement (only in classic runtime)
           *       "pragmaFrag": "DomFrag", // default is React.Fragment (only in classic runtime)
           *       "throwIfNamespace": false, // defaults to true
           *       "runtime": "classic" // defaults to classic
           *       // "importSource": "custom-jsx-library" // defaults to react (only in automatic runtime)
           *     }
           *   ],
           *   ["@babel/preset-flow"]
           * ]
           *
           *
           * 提高 babel-loader 编译性能
           * 1. cacheDirectory 打开，注意 cacheIdentifier 是否需要定制过期
           * 2. 引入 Babel runtime 作为一个独立模块，来避免重复引入，引入 @babel/plugin-transform-runtime 并且使所有辅助代码从这里引用
           *    - 注意：你必须执行 npm install -D @babel/plugin-transform-runtime 来把它包含到你的项目中，
           *    - 然后使用 npm install @babel/runtime 把 @babel/runtime 安装为一个依赖
           *
           * cacheDirectory 默认值为 false
           * 当有设置时，指定的目录将用来缓存 loader 的执行结果。
           * 之后的 webpack 构建，将会尝试读取缓存，来避免在每次执行时，
           * 可能产生的、高性能消耗的 Babel 重新编译过程(recompilation process)。
           * 如果设置了一个空值 (loader: 'babel-loader?cacheDirectory') 或者 true (loader: 'babel-loader?cacheDirectory=true')，
           * loader 将使用默认的缓存目录 node_modules/.cache/babel-loader，
           * cacheDirectory: "../node_modules/.cache/babel-loader", 是以当前跟目录为相对路径进行配置
           * 如果在任何根目录下都没有找到 node_modules 目录，将会降级回退到操作系统默认的临时文件目录
           *
           * cacheIdentifier
           * 默认是由 @babel/core 版本号，babel-loader 版本号，.babelrc 文件内容（存在的情况下），环境变量 BABEL_ENV 的值（没有时降级到 NODE_ENV）组成的一个字符串。
           * 可以设置为一个自定义的值，在 identifier 改变后，来强制缓存失效
           *
           * cacheCompression 默认值为 true
           * 当设置此值时，会使用 Gzip 压缩每个 Babel transform 输出。
           * 如果你想要退出缓存压缩，将它设置为 false -- 如果你的项目中有数千个文件需要压缩转译，那么设置此选项可能会从中收益
           *
           * customize 默认值为 null
           * 导出 custom 回调函数的模块路径，例如传入 .custom() 的 callback 函数。
           * 由于你必须创建一个新文件才能使用它，建议改为使用 .custom 来创建一个包装 loader。
           * 只有在你_必须_继续直接使用 babel-loader 但又想自定义的情况下，才使用这项配置
           *
           * exclude 排除不应参与转码的库 // \\ for Windows, \/ for Mac OS and Linux
           * "exclude": [/node_modules[\\\/]core-js/,/node_modules[\\\/]webpack[\\\/]buildin/,],
           *
           * compact Default: "auto" || code.length > 500_000
           * 在紧凑模式下生成代码时，将省略所有可选的换行符和空格。
           *
           */
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: paths.appPath,
            exclude: /(node_modules|bower_components)/,
            loader: require.resolve("babel-loader"),
            options: {
              babelrc: false,
              configFile: false,
              cacheDirectory: true,
              cacheCompression: false,
              compact: true,
              // customize: require.resolve('babel-preset-react-app/webpack-overrides'),
              presets: [
                [
                  /**
                   *
                   * @babel/preset-env
                   * Webpack 支持打包成多种 部署目标 。
                   * 例如，当需要为不同的部署目标（例如 web 和 node）指定不同的 Babel 配置时， babel-loader 通过 Babel 的caller API 提供了 target属性
                   * 例如，根据 webpack 的部署目标改变传给@babel/preset-env的 targets选项
                   *
                   * useBuiltIns  "usage" | "entry" | false, defaults to false
                   * 安装：@babel/polyfill
                   * 所使用的 env preset 提供了一个 "useBuiltIns" 参数，当此参数设置为 "usage" 时，就会加载上面所提到的最后一个优化措施，也就是只包含你所需要的 polyfill
                   *
                   * targets  string | Array<string> | { [string]: string }
                   * 设置不同浏览器打包通道
                   * "presets": [["@babel/preset-env", { "targets": "defaults" }]]
                   * 如果不配置 targets | ignoreBrowserslistConfig 则使用浏览器中的 browserslist
                   */
                  /**
                   * targets
                   *  如果设置了 targets，那么 babel 就不使用 browserslist 配置，而是使用 targets 配置。
                   *  如果targets不配置，browserslist也没有配置，那么@babel/preset-env就对所有ES6语法转换成ES5的。
                   * useBuiltIns
                   *  false：polyfill就会全部引入。设置后，需要手动引入 polyfill
                   *  entry：会根据配置的目标环境引入需要的polyfill。设置后，需要在项目入口处手动引入 polyfill
                   *  usage：会根据配置的目标环境，并考虑项目代码里使用到的ES6特性引入需要的polyfill，设置后，不需要手动引入 polyfill
                   *  注意，使用'entry'的时候，只能import polyfill一次，一般都是在入口文件。如果进行多次import，会发生错误
                   * corejs
                   *  这个参数项只有useBuiltIns设置为'usage'或'entry'时，才会生效。
                   *  3 || 2 默认值
                   * modules
                   *  该项用来设置是否把ES6的模块化语法改成其它模块化语法
                   *  "amd" || "umd" || "systemjs" || "commonjs" || "cjs" || false || "auto"默认值
                   *  在该参数项值是 'auto' 或不设置的时候，会发现我们转码前的代码里es6 的 import都被转码成 commonjs 的 require了
                   */
                  require("@babel/preset-env"),
                  {
                    useBuiltIns: "entry",
                    corejs: 3,
                    exclude: ["transform-typeof-symbol"],
                    targets: "> 0.25%, not dead",
                    targets: {
                      chrome: "58", // chrome, opera, edge, firefox, safari, ie, ios, android, node, electron
                      ie: "11",
                    },
                    targets: {
                      browserslist: {
                        production: [">0.2%", "not dead", "not op_mini all"],
                        development: [
                          "last 1 chrome version",
                          "last 1 firefox version",
                          "last 1 safari version",
                        ],
                      },
                    },
                  },
                ],
                [
                  /**
                   * @babel/preset-flow
                   * 如果您使用了 Flow，则建议您使用此预设（preset）。
                   * Flow 是一个针对 JavaScript 代码的静态类型检查器。此预设（preset）包含以下插件：
                   * @babel/plugin-transform-flow-strip-types
                   *
                   */
                  "@babel/preset-flow",
                ],
                [
                  /**
                   * @babel/preset-react
                   *
                   * 始终包含以下插件：
                   * @babel/plugin-syntax-jsx
                   * @babel/plugin-transform-react-jsx
                   * @babel/plugin-transform-react-display-name
                   *
                   * 如果开启了 development 参数，还将包含以下插件
                   * @babel/plugin-transform-react-jsx-self
                   * @babel/plugin-transform-react-jsx-source
                   *
                   * runtime classic | automatic，默认值为 classic
                   * 当设置为 automatic 时，将自动导入（import）JSX 转换而来的函数。当设置为 classic 时，不会自动导入（import）任何东西
                   *
                   * development boolean 类型，默认值为 false
                   * 这可以用于开启特定于开发环境的某些行为，例如添加 __source 和 __self
                   * 在与 env 参数 配置或 js 配置文件 配合使用时，此功能很有用
                   */
                  require("@babel/preset-react").default,
                  {
                    development: false, // 开发环境需要true
                    useBuiltIns: true,
                    runtime: "automatic",
                  },
                ],
                /**
                 * @babel/preset-typescript
                 * 如果您使用了 TypeScript 这一 JavaScript 超集，则建议您使用此预设（preset）。它包含以下插件：
                 * @babel/plugin-transform-typescript
                 */
                [require("@babel/preset-typescript").default],
              ],
              plugins: [
                /**
                 * "@babel/plugin-proposal-nullish-coalescing-operator",
                 * "@babel/plugin-proposal-optional-chaining",
                 * "@babel/plugin-transform-flow-strip-types",
                 * "@babel/plugin-transform-runtime",
                 *
                 * "@babel/plugin-syntax-jsx",
                 * "@babel/plugin-transform-react-jsx",
                 * "@babel/plugin-transform-react-display-name",
                 * "@babel/plugin-transform-react-jsx-self", // dev
                 * "@babel/plugin-transform-react-jsx-source", // dev
                 * "@babel/plugin-transform-typescript", // ts
                 * "@babel/plugin-transform-arrow-functions", // 箭头函数
                 *
                 * 对注解的支持，上下顺序不能颠倒
                 * https://babel.docschina.org/docs/en/next/babel-plugin-proposal-decorators/
                 * @babel/plugin-proposal-decorators
                 * @babel/plugin-proposal-class-properties
                 *
                 * @babel/plugin-proposal-numeric-separator 从数字中删除分隔符
                 *
                 * babel-plugin-macros
                 * https://juejin.cn/post/6844904052581466120
                 *
                 * babel-plugin-transform-react-remove-prop-types
                 * 删除 propTypes
                 *
                 * babel-plugin-named-asset-import
                 *
                 * babel-plugin-add-module-exports
                 * 为css或less添加默认导出
                 */
                ["@babel/plugin-syntax-jsx"],
                ["@babel/plugin-transform-react-jsx"],
                ["@babel/plugin-transform-react-display-name"],
                ["@babel/plugin-transform-react-jsx-self"],
                ["@babel/plugin-transform-react-jsx-source"],
                ["@babel/plugin-transform-typescript"],
                [
                  "add-module-exports", // babel-plugin-add-module-exports 没起作用
                  {
                    addDefaultProperty: true,
                  },
                ],
                require("@babel/plugin-proposal-nullish-coalescing-operator")
                  .default,
                require("@babel/plugin-proposal-optional-chaining").default,
                [
                  require("@babel/plugin-transform-flow-strip-types").default,
                  false,
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
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                require("babel-plugin-macros"),
                [
                  require("babel-plugin-transform-react-remove-prop-types")
                    .default,
                  {
                    removeImport: true,
                  },
                ],
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
            /**
             * css和less配置
             * 1. css的模块主要作用是部分css变量统一化，例如多主题比较实用
             * 2. 懒加载css则能提高项目加载的速度
             * 3. 普通css加载，module+lazy的组合有多种，目前场景没有那么复杂，暂时只用简单的即可
             *
             * module配置备份：
             * test: /\.module\.(less|css)$/,
             * css-loader中添加：
             * modules.compileType: 'module'
             *
             * 懒加载 lazy.css 能提高项目加载速度，配置：
             * test: /\.lazy\.(less|css)$/,
             * style-loader中添加：
             * injectType: 'lazyStyleTag'
             *
             * 如果你正在使用 Babel且为了程序正常工作，你需要进行下面的步骤：
             * 1. 添加 babel-plugin-add-module-exports 到你的配置中。
             * 2. 你需要在每一个样式模块中有一个默认导出。
             *
             * 问题：
             * 1. css中静态资源暂无处理，直接使用资源模块处理
             * 2. 在css编译中添加 include 只处理src内部的 css或less，对于像ant中的less和css不能用 postcss-loader 处理，会导致样式丢失
             */
            test: /\.(less|css)$/,
            include: /src/,
            exclude: /\.(module|lazy)\.(less|css)$/,
            use: [
              /**
               * style-loader
               *
               * injectType
               * 通过使用多个 <style></style> 自动把 styles 插入到 DOM 中。该方式是默认行为
               *
               * lazyStyleTag
               * 推荐 lazy style 遵循使用 .lazy.css 作为后缀的命名约定，style-loader 基本用法是使用 .css 作为文件后缀（其他文件也一样，比如：.lazy.less 和 .less）
               * 当使用 lazyStyleTag 时，style-loader 将惰性插入 styles，在需要使用 styles 时可以通过 style.use() / style.unuse() 使 style 可用
               * ```js
               * import styles from './styles.lazy.css';
               *
               * styles.use();
               * // 要移除 styles 时你可以调用
               * // styles.unuse();
               * ```
               *
               * attributes
               * 如果配置了 attributes，style-loader 将会在 <style> / <link> 上绑定指定的 attributes 以及它们的值。
               * 例如下配置则会产生：<style id="id"></style>
               *
               * base
               * 这个配置主要是作为使用 DllPlugin 时出现 css clashes 问题时的解决方案。
               * base 允许你通过指定一个比 DllPlugin1 使用的 css 模块 id 大的值，来避免应用程序中的 css (或者 DllPlugin2 的 css) 被 DllPlugin1 中的 css 覆盖问题
               *
               * esModule 【必须配置】
               * 默认情况下，style-loader 生成使用 ES 模块语法的 JS 模块。在某些情况下使用 ES 模块语法更好，比如：module concatenation 和 tree shaking 时。
               *
               * modules
               * 配置 CSS 模块。
               *
               * modules.namedExport 【必须配置】
               * 类型：Boolean 默认值：false
               * 启用/禁用本地 ES 模块的命名导出功能
               * - 本地命名导出时，会将其名称转换为 camelCase 的形式
               * - 并且不允许在 css 的 class 名中使用 JavaScript 的保留字
               * - 在 css-loader 和 style-loader 中，选项 esModule 和 modules.namedExport 应启用。
               *
               * localIdentName
               * 名字混淆规则：[name] 文件名 [local] 本身类名
               *
               * 如果需要在head里面插入css
               * rules: [
               *   {
               *     test: /\.css$/i,
               *     use: [
               *       {
               *         loader: 'style-loader',
               *         options: {
               *           insert: function insertBeforeAt(element) {
               *             const parent = document.querySelector('head');
               *             const target = document.querySelector('#id');
               *
               *             const lastInsertedElement =
               *               window._lastElementInsertedByStyleLoader;
               *
               *             if (!lastInsertedElement) {
               *               parent.insertBefore(element, target);
               *             } else if (lastInsertedElement.nextSibling) {
               *               parent.insertBefore(element, lastInsertedElement.nextSibling);
               *             } else {
               *               parent.appendChild(element);
               *             }
               *
               *             window._lastElementInsertedByStyleLoader = element;
               *           },
               *         },
               *       },
               *       'css-loader',
               *     ],
               *   },
               * ],
               *
               * 问题：
               * 1. 是否要启用 lazy.css 方式进行css配置打包？
               * 2. 生产环境 使用 dll方式的话，记得进行 base 的配置。
               */
              {
                loader: "style-loader", // dev
                loader: MiniCssExtractPlugin.loader, // pro
                options: {
                  esModule: true,
                  modules: {
                    namedExport: true,
                    localIdentName: "[local]",
                    localIdentName: "[path][name]__[local]--[hash:base64:5]",
                  },
                },
              },
              /**
               * ====================================================================================================================
               * css-loader
               * 会对 @import 和 url() 进行处理，就像 js 解析 import/require() 一样
               *
               * url 默认值: true
               * 启用/禁用 url/image-set 函数进行处理。 控制 url() 函数的解析。绝对路径和根目录的相对 URL 现在会被解析
               * url('./image.png') => require('./image.png')
               * url('http://dontwritehorriblecode.com/2112.png') => require('http://dontwritehorriblecode.com/2112.png')
               * image-set(url('image2x.png') 1x, url('image1x.png') 2x) => require('./image1x.png') and require('./image2x.png')
               *
               * 要从 node_modules 目录（包括 resolve.modules）导入资源，而对于 alias，请加上一个前缀 ~：
               * url(~module/image.png) => require('module/image.png')
               * url('~module/image.png') => require('module/image.png')
               * url(~aliasDirectory/image.png) => require('otherDirectory/image.png')
               *
               * options: {
               * url: (url, resourcePath) => {
               *     // resourcePath - css 文件的路径
               *
               *     // 不处理 `img.png` url
               *     if (url.includes("img.png")) {
               *       return false;
               *     }
               *
               *     return true;
               *   },
               * },
               *
               * import 默认值: true
               * 启用/禁用 @import 规则进行处理 控制 @import 的解析。@import 中的绝对 URL 会被直接移到运行时去处理
               * @import './style.css' => require('./style.css')
               * @import url(./style.css) => require('./style.css')
               * @import url('./style.css') => require('./style.css')
               * @import url('http://dontwritehorriblecode.com/style.css') => @import url('http://dontwritehorriblecode.com/style.css') in runtime
               *
               * 要从 node_modules 目录（包括 resolve.modules）导入样式，而对于 alias，请加上一个前缀 ~：
               * @import url(~module/style.css) => require('module/style.css')
               * @import url('~module/style.css') => require('module/style.css')
               * @import url(~aliasDirectory/style.css) => require('otherDirectory/style.css')
               *
               * modules
               * 设置为 false 值会提升性能，因为避免了 CSS Modules 特性的解析，这对于使用普通 CSS 或者其他技术的开发人员是非常有用的
               * 以下为默认配置：【需要配置】
               * {
               *   test: /\.css$/i,
               *   loader: "css-loader",
               *   options: {
               *     modules: {
               *       compileType: "module",
               *       mode: "local",
               *       auto: true,
               *       exportGlobals: true,
               *       localIdentName: "[path][name]__[local]--[hash:base64:5]",
               *       localIdentContext: path.resolve(__dirname, "src"),
               *       localIdentHashPrefix: "my-custom-hash",
               *       namedExport: true,
               *       exportLocalsConvention: "camelCase",
               *       exportOnlyLocals: false,
               *     },
               *   },
               * },
               *
               * modules.namedExport 【必须配置】
               * 本地环境启用/禁用 export 的 ES 模块
               * - 本地环境的命名将转换为驼峰格式，即 exportLocalsConvention 选项默认设置了 camelCaseOnly
               * - 不允许在 CSS 类名中使用 JavaScript 保留字
               *
               * modules.exportLocalsConvention
               * 类型：String 默认：取决于 modules.namedExport 选项值，如果为 true 则对应的是 camelCaseOnly，反之对应的是 asIs
               * 导出的类名称的样式
               * - 如果你设置 namedExport 为 true 那么只有 camelCaseOnly 被允许。
               *
               * modules.exportGlobals
               * 允许 css-loader 从全局类或 ID 导出名称，因此您可以将其用作本地名称
               *
               * modules.exportOnlyLocals  类型：Boolean 默认：false
               * 仅导出局部环境。
               * 使用 css 模块 进行预渲染（例如 SSR）时很有用。
               * 要进行预渲染，预渲染包 应使用 mini-css-extract-plugin 选项而不是 style-loader!css-loader。
               * 它不嵌入 CSS，而仅导出标识符映射。
               *
               * importLoaders 默认：0
               * 启用/禁用或设置在CSS加载程序之前应用的加载程序的数量
               * importLoaders 选项允许你配置在 css-loader 之前有多少 loader 应用于@imported 资源
               * importLoaders: 2,
               *  // 0 => no loaders (default);
               *  // 1 => postcss-loader;
               *  // 2 => postcss-loader, sass-loader
               *
               * esModule 默认：true
               * 默认情况下，css-loader 生成使用 ES 模块语法的 JS 模块。 在某些情况下，使用 ES 模块是有益的，例如在模块串联或 tree shaking 时。
               *
               * 问题：
               * 1. css 是否需要采用 module 打包 ??????????
               */
              {
                loader: "css-loader",
                options: {
                  importLoaders: 2,
                  esModule: true,
                  modules: {
                    namedExport: true,
                  },
                },
              },
              /**
               * postcss-loader postcss
               * 在 css-loader 和 style-loader 之前使用它，但是在其他预处理器（例如：sass|less|stylus-loader）之后使用
               *
               * execute
               * 如果你在 JS 文件中编写样式，请使用 postcss-js parser，并且添加 execute 选项
               * yarn add --dev postcss-js
               * options: {
               *    postcssOptions: {
               *      parser: "postcss-js",
               *    },
               *    execute: true,
               *  },
               *
               * postcssOptions.syntax【不明白用途】
               * postcssOptions.parser【不明白用途】
               * postcssOptions.stringifier【不明白用途】
               *
               * postcssOptions.plugins
               * ["postcss-preset-env", "postcss-import",["postcss-short", { prefix: "x" }],]
               * postcss-preset-env 包含 autoprefixer，因此如果你已经使用了 preset 就无需单独添加它了。更多 信息
               *
               */
              {
                // 【webpack 5版本】postcssOptions 是在 5版本中添加，4以及4以前版本直接写在options中
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
                // 【webpack 4版本】
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
              /**
               * ====================================================================================================================
               * less less-loader
               *
               * lessOptions.webpackImporter
               * 在某些情况下，这样做可以提高性能，但是请慎用，因为可能会使得 aliases 和以 ~ 开头的 @import 规则失效。
               *
               * 在其前面加上 〜 很关键，因为 〜/ 会解析到根目录。
               * webpack 需要区分 bootstrap 和 〜bootstrap，因为 CSS 和 Less 文件没有用于导入相对路径文件的特殊语法。
               * 写 @import“ file” 等同于 @import“ ./file”;
               * 可以通过 resolve.byDependency 修改默认解析器配置
               * 问题：
               * 1. resolve.byDependency 具体作用
               * 2. lessOptions.strictMath 具体作用没搞明白
               * 3. lessOptions.javascriptEnabled 不配置会报错，暂时先配置上去
               * 【4 vs 5】javascriptEnabled 此节点在4中是直接配置在 options 下，如果在5版本中配置在 lessOptions中
               *      切记如果引入了ant的less，需要单独给处理：不能用 postcss-loader & 使用 less-loader 一定要配置 javascriptEnabled
               */
              {
                loader: "less-loader",
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
            test: /\.module\.(less|css)$/,
            include: /src/,
            exclude: /\.lazy\.(less|css)$/,
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
                    compileType: "module",
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
                    strictMath: false,
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
                loader: require.resolve("style-loader"),
                options: {
                  injectType: "lazyStyleTag",
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
          /**
           * 此处处理 node_modules 中引入的less文件，切记两点
           * 1. 不能用 postcss-loader
           * 2. 使用 less-loader 一定要配置 javascriptEnabled
           * 切记如果引入了ant的less，需要单独给处理：不能用 postcss-loader & 使用 less-loader 一定要配置 javascriptEnabled
           */
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
                    strictMath: false,
                    javascriptEnabled: true,
                    modifyVars: {
                      "primary-color": "#F5222D",
                      "border-radius-base": "2px",
                    },
                  },
                },
              },
            ],
            sideEffects: true,
          },
          /**
           * 资源模块类型(asset module type)，通过添加 4 种新的模块类型，来替换所有这些 loader：
           * - asset/resource 发送一个单独的文件并导出 URL。之前通过使用 file-loader 实现。
           * - asset/inline 导出一个资源的 data URI。之前通过使用 url-loader 实现。
           * - asset/source 导出资源的源代码。之前通过使用 raw-loader 实现。
           * - asset 在导出一个 data URI 和发送一个单独的文件之间自动选择。之前通过使用 url-loader，并且配置资源体积限制实现。
           *
           * 自定义输出文件名
           * 默认情况下，asset/resource 模块以 [hash][ext][query] 文件名发送到输出目录。
           * 可以通过在 webpack 配置中设置 output.assetModuleFilename 来修改此模板字符串：
           * assetModuleFilename: 'images/[hash][ext][query]'
           *
           *
           * generator.dataUrl 【主要用于图片等静态资源配置】
           * - encoding: 当被设置为'base64'，模块源码会用 Baes64算法 编码。设置 encoding 为 false，会禁用编码。
           * - mimetype: 为数据链接(data URI)设置的一个 mimetype 值。默认根据模块资源后缀设置
           * rules: [
           * {
           *   //...
           *   generator: {
           *     dataUrl: {
           *       encoding: 'base64',
           *       mimetype: 'mimetype/png',
           *     },
           *   },
           * },
           * ],
           *  当被作为一个函数使用，它必须为每个模块执行且并须返回一个数据链接(data URI)字符串
           * rules: [
           * {
           *   //...
           *   generator: {
           *     dataUrl: (content) => {
           *       const svgToMiniDataURI = require('mini-svg-data-uri');
           *       if (typeof content !== 'string') {
           *         content = content.toString();
           *       }
           *       return svgToMiniDataURI(content);
           *     },
           *   },
           * },
           * ],
           *
           *
           * generator.filename 可用版本：5.25.0+
           * 对某些特定的规则而言与 output.assetModuleFilename 相同.
           * 覆盖了 output.assetModuleFilename 选项并且仅与 asset 和 asset/resource 模块类型一同起作用
           *
           * generator.publicPath 可用版本：5.28.0+
           * 对指定的资源模式指定 publicPath
           * 不同环境走不同的cdn
           * {
           *  test: /\.html/,
           *  type: 'asset/resource',
           *  generator: {
           *    filename: 'static/[hash][ext]',
           *    publicPath: 'assets/',
           *  },
           * },
           *
           * 【webpack4 暂不支持，兼容小程序打包，暂时去掉】
           */
          {
            test: /\.(png|jpg|jpeg|gif)$/,
            type: "asset/resource",
            generator: {
              filename: "static/media/[hash][ext][query]",
              // publicPath: '', // cdn 配置，调整为走env读取
            },
          },
          {
            test: /\.svg$/,
            type: "asset/inline",
          },
          {
            test: /\.(pdf|txt)$/,
            type: "asset",
            generator: {
              filename: "static/media/[hash][ext][query]",
              // publicPath: '', // cdn 配置，调整为走env读取
            },
          },
          {
            test: /\.(png|jpg|gif|svg)$/,
            loader: "file-loader",
            options: {
              name: "[name].[ext]?[hash]",
            },
          },
          {
            test: require.resolve("../src/common/globals.js"),
            use: "exports-loader?type=commonjs&exports=file,multiple|helpers.parse|parse",
          },
        ],
      },
    ],
  },
};
````

### webpack 注解使用

- 会在浏览器闲置下载文件
  `/* webpackPrefetch: true */`

- 会在父 chunk 加载时并行下载文件
  `/* webpackPreload: true */`

- 是为预加载的文件取别名 [index] and [request] 占位符，分别支持赋予一个递增的数字和实际解析的文件名
  `/* webpackChunkName: 'chunkName' */`
  `/* webpackChunkName: "chunk-[request][index]" */`
  https://www.webpackjs.com/api/module-methods/
  https://webpack.js.org/api/module-methods/

组合使用：
`const { default: _ } = await import(/* webpackChunkName: "lodash" */ /* webpackPrefetch: true */ 'lodash');`

**建议项目只给页面添加：webpackChunkName 打包后 chunk 识别度比较高**

- 使用 /_ webpackIgnore: true _/ 注释禁用 url 解析

有了 /_ webpackIgnore: true _/ 注释，可以禁用对规则和单个声明的源处理

```css
/* webpackIgnore: true */
@import url(./basic.css);
@import /* webpackIgnore: true */ url(./imported.css);

.class {
  /* 对 'background' 声明中的所有 url 禁用 url 处理 */
  color: red;
  /* webpackIgnore: true */
  background: url("./url/img.png"), url("./url/img.png");
}

.class {
  /* 对 'background' 声明中第一个 url 禁用 url 处理 */
  color: red;
  background:
    /* webpackIgnore: true */ url("./url/img.png"), url("./url/img.png");
}

.class {
  /* 对 'background' 声明中第二个 url 禁用 url 处理 */
  color: red;
  background: url("./url/img.png"),
    /* webpackIgnore: true */ url("./url/img.png");
}

/* prettier-ignore */
.class {
  /* 对 'background' 声明中第二个 url 禁用 url 处理 */
  color: red;
  background: url("./url/img.png"),
    /* webpackIgnore: true */
    url("./url/img.png");
}

/* prettier-ignore */
.class {
  /* 对 'background-image' 声明中第三和第六个 url 禁用 url 处理 */
  background-image: image-set(
    url(./url/img.png) 2x,
    url(./url/img.png) 3x,
    /* webpackIgnore:  true */ url(./url/img.png) 4x,
    url(./url/img.png) 5x,
    url(./url/img.png) 6x,
    /* webpackIgnore:  true */
    url(./url/img.png) 7x
  );
}
```

### TypeScript [TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

TypeScript 是 JavaScript 的超集，为其增加了类型系统，可以编译为普通 JavaScript 代码

`yarn add --dev typescript ts-loader`

**如果想在`TypeScript`中保留如`import _ from 'lodash';`的语法被让它作为一种默认的导入方式，需要在文件`tsconfig.json`中设置`"allowSyntheticDefaultImports" : true`和`"esModuleInterop" : true`**

还需要在 babel-loader 中添加以下 plugins

@babel/preset-typescript
@babel/plugin-transform-typescript

[热编译](https://github.com/pmmmwh/react-refresh-webpack-plugin)
