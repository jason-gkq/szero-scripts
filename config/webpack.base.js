// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

const fs = require('fs');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');
/**
 * 
 */
const PnpWebpackPlugin = require('pnp-webpack-plugin');
// 清理打包获得文件
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
/**
 * JS
 */
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
// webpack转译Typescript现有方案
// 单进程方案(类型检查和转译在同一个进程) ts-loader(transpileOnly为false)  awesome-typescript-loader
// 多进程方案 ts-loader(transpileOnly为true) + fork-ts-checker-webpack-plugin  [awesome-typescript-loader + 自带的CheckerPlugin]  [babel + fork-ts-checker-webpack-plugin]
// 综合考虑性能和扩展性，目前比较推荐的是babel+fork-ts-checker-webpack-plugin方案
// https://www.npmjs.com/package/fork-ts-checker-webpack-plugin
// {
//   test: /\.tsx?$/,
//   use:{
//     loader: 'ts-loader',
//     options: {
//       transpileOnly: true  // ? 关闭类型检查，即只进行转译
//     }
//   }
// }
// plugins: [
//   new ForkTsCheckerWebpackPlugin({ // ? fork一个进程进行检查，并设置async为false，将错误信息反馈给webpack
//     async: false,
//     eslint: false
//   })
// ]
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const reactRefreshOverlayEntry = require.resolve('react-dev-utils/refreshOverlayInterop');

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';

// Variable used for enabling profiling in Production
// passed into alias object. Uses a flag if passed into the build command
const isProfile = process.env.IS_PEOFILE === 'true';

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000');

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const hasJsxRuntime = (() => {
	if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
		return false;
	}

	try {
		require.resolve('react/jsx-runtime');
		return true;
	} catch (e) {
		return false;
	}
})();

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function(webpackEnv) {
	// const isEnvDevelopment = webpackEnv === 'development';
	// const isEnvProduction = webpackEnv === 'production';

	// We will provide `paths.publicUrlOrPath` to our app
	// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
	// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
	// Get environment variables to inject into our app.
	const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

	// const shouldUseReactRefresh = env.raw.FAST_REFRESH;

	const { getEnvConfig, getStyleLoaders, getJsLoaders } = require(`./webpack/webpack.${webpackEnv}`);
	const envConfig = getEnvConfig({
		paths,
		env,
		shouldInlineRuntimeChunk,
		useTypeScript,
		disableESLintPlugin,
		emitErrorsAsWarnings,
		hasJsxRuntime
	});

	return merge(
		{
			resolve: {
				// This allows you to set a fallback for where webpack should look for modules.
				// We placed these paths second because we want `node_modules` to "win"
				// if there are any conflicts. This matches Node resolution mechanism.
				// https://github.com/facebook/create-react-app/issues/253
				modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
				// These are the reasonable defaults supported by the Node ecosystem.
				// We also include JSX as a common component filename extension to support
				// some tools, although we do not recommend using it, see:
				// https://github.com/facebook/create-react-app/issues/290
				// `web` extension prefixes have been added for better support
				// for React Native Web.
				extensions: paths.moduleFileExtensions
					.map(ext => `.${ext}`)
					.filter(ext => useTypeScript || !ext.includes('ts')),
				alias: {
					// Support React Native Web
					// https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
					'react-native': 'react-native-web',
					// Allows for better profiling with ReactDevTools
					...(isProfile && {
						'react-dom$': 'react-dom/profiling',
						'scheduler/tracing': 'scheduler/tracing-profiling'
					}),
					...(modules.webpackAliases || {})
				},
				plugins: [
					// Adds support for installing with Plug'n'Play, leading to faster installs and adding
					// guards against forgotten dependencies and such.
					PnpWebpackPlugin,
					// Prevents users from importing files from outside of src/ (or node_modules/).
					// This often causes confusion because we only process files within src/ with babel.
					// To fix this, we prevent you from importing files out of src/ -- if you'd like to,
					// please link the files into your node_modules/ and let module-resolution kick in.
					// Make sure your source files are compiled, as they will not be processed in any way.
					new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson, reactRefreshOverlayEntry])
				]
			},
			resolveLoader: {
				plugins: [
					// Also related to Plug'n'Play, but this time it tells webpack to load its loaders
					// from the current package.
					PnpWebpackPlugin.moduleLoader(module)
				]
			},
			module: {
				// 动态依赖的警告：wrappedContextCritical: true。
				// require(expr) 应该包含整个目录：exprContextRegExp: /^\.\//
				// require("./templates/" + expr) 不应该包含默认子目录：wrappedContextRecursive: false
				// strictExportPresence 将缺失的导出提示成错误而不是警告
				// 为部分动态依赖项设置内部正则表达式：wrappedContextRegExp: /\\.\\*/

				// exprContextCritical: true,
				// exprContextRecursive: true,
				// exprContextRegExp: false,
				// exprContextRequest: '.',
				// unknownContextCritical: true,
				// unknownContextRecursive: true,
				// unknownContextRegExp: false,
				// unknownContextRequest: '.',
				// wrappedContextCritical: false,
				// wrappedContextRecursive: true,
				// wrappedContextRegExp: /.*/,
				// strictExportPresence: false // since webpack 2.3.0
				strictExportPresence: true,
				// Loaders 可以通过传入多个 loaders 以达到链式调用的效果，它们会从右到左被应用（从最后到最先配置）。
				rules: [
					{
						parser: {
							// amd: false, // 禁用 AMD
							// commonjs: false, // 禁用 CommonJS
							// system: false, // 禁用 SystemJS
							// harmony: false, // 禁用 ES2015 Harmony import/export
							// requireInclude: false, // 禁用 require.include
							// requireEnsure: false, // 禁用 require.ensure
							// requireContext: false, // 禁用 require.context
							// browserify: false, // 禁用特殊处理的 browserify bundle
							// requireJs: false, // 禁用 requirejs.*
							// node: false, // 禁用 __dirname, __filename, module, require.extensions, require.main, 等。
							// node: {...}, // 在模块级别(module level)上重新配置 [node](/configuration/node) 层(layer)
							// worker: ["default from web-worker", "..."] // 自定义 WebWorker 对 JavaScript 的处理，其中 "..." 为默认值。
							requireEnsure: false
						}
					},
					{
						// "oneOf" will traverse all following loaders until one will
						// match the requirements. When no loader matches it will fall
						// back to the "file" loader at the end of the loader list.
						oneOf: [
							// TODO: Merge this config once `image/avif` is in the mime-db
							// https://github.com/jshttp/mime-db
							{
								test: [/\.avif$/],
								loader: require.resolve('url-loader'),
								options: {
									limit: imageInlineSizeLimit,
									mimetype: 'image/avif',
									name: 'static/media/[name].[fullhash:8].[ext]'
								}
							},
							// "url" loader works like "file" loader except that it embeds assets
							// smaller than specified limit in bytes as data URLs to avoid requests.
							// A missing `test` is equivalent to a match.
							{
								test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
								loader: require.resolve('url-loader'),
								options: {
									limit: imageInlineSizeLimit,
									name: 'static/media/[name].[fullhash:8].[ext]'
								}
							},
							// {
							// 	test: /\.svg$/,
							// 	use: ['url-loader', 'file-loader']
							// },
							...getJsLoaders({ paths, env, shouldUseSourceMap, hasJsxRuntime }),
							// "postcss" loader applies autoprefixer to our CSS.
							// "css" loader resolves paths in CSS and adds assets as dependencies.
							// "style" loader turns CSS into JS modules that inject <style> tags.
							// In production, we use MiniCSSExtractPlugin to extract that CSS
							// to a file, but in development "style" loader enables hot editing
							// of CSS.
							// By default we support CSS Modules with the extension .module.css
							{
								test: cssRegex,
								exclude: cssModuleRegex,
								use: getStyleLoaders({
									cssOptions: {
										importLoaders: 1,
										sourceMap: shouldUseSourceMap
									},
									shouldUseSourceMap,
									paths
								}),
								// Don't consider CSS imports dead code even if the
								// containing package claims to have no side effects.
								// Remove this when webpack adds a warning or an error for this.
								// See https://github.com/webpack/webpack/issues/6571
								sideEffects: true
							},
							// Adds support for CSS Modules (https://github.com/css-modules/css-modules)
							// using the extension .module.css
							{
								test: cssModuleRegex,
								use: getStyleLoaders({
									cssOptions: {
										importLoaders: 1,
										sourceMap: shouldUseSourceMap,
										modules: {
											getLocalIdent: getCSSModuleLocalIdent
										}
										// modules: {
										// 	compileType: "module",
										// 	mode: "local",
										// 	auto: true,
										// 	exportGlobals: true,
										// 	localIdentName: "[path][name]__[local]--[hash:base64:5]",
										// 	localIdentContext: path.resolve(__dirname, "src"),
										// 	localIdentHashPrefix: "my-custom-hash",
										// 	namedExport: true,
										// 	exportLocalsConvention: "camelCase",
										// 	exportOnlyLocals: false,
										// },
									},
									shouldUseSourceMap,
									paths
								})
							},
							// Opt-in support for SASS (using .scss or .sass extensions).
							// By default we support SASS Modules with the
							// extensions .module.scss or .module.sass
							{
								test: sassRegex,
								exclude: sassModuleRegex,
								use: getStyleLoaders({
									cssOptions: {
										importLoaders: 3,
										sourceMap: shouldUseSourceMap
									},
									preProcessor: 'sass-loader',
									shouldUseSourceMap,
									paths
								}),
								// Don't consider CSS imports dead code even if the
								// containing package claims to have no side effects.
								// Remove this when webpack adds a warning or an error for this.
								// See https://github.com/webpack/webpack/issues/6571
								sideEffects: true
							},
							// Adds support for CSS Modules, but using SASS
							// using the extension .module.scss or .module.sass
							{
								test: sassModuleRegex,
								use: getStyleLoaders({
									cssOptions: {
										importLoaders: 3,
										sourceMap: shouldUseSourceMap,
										modules: {
											getLocalIdent: getCSSModuleLocalIdent
										}
									},
									preProcessor: 'sass-loader',
									shouldUseSourceMap,
									paths
								})
							},
							// "file" loader makes sure those assets get served by WebpackDevServer.
							// When you `import` an asset, you get its (virtual) filename.
							// In production, they would get copied to the `build` folder.
							// This loader doesn't use a "test" so it will catch all modules
							// that fall through the other loaders.
							{
								loader: require.resolve('file-loader'),
								// Exclude `js` files to keep "css" loader working as it injects
								// its runtime that would otherwise be processed through "file" loader.
								// Also exclude `html` and `json` extensions so they get processed
								// by webpacks internal loaders.
								exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
								options: {
									name: 'static/media/[name].[fullhash:8].[ext]'
								}
							}
							// ** STOP ** Are you adding a new loader?
							// Make sure to add the new loader(s) before the "file" loader.
						]
					}
				]
			},
			plugins: [
				new CleanWebpackPlugin(),
				new ModuleNotFoundPlugin(paths.appPath),
				new webpack.DefinePlugin(env.stringified),
				new WebpackManifestPlugin({
					fileName: 'asset-manifest.json',
					publicPath: paths.publicUrlOrPath,
					generate: (seed, files, entrypoints) => {
						const manifestFiles = files.reduce((manifest, file) => {
							manifest[file.name] = file.path;
							return manifest;
						}, seed);
						const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith('.map'));

						return {
							files: manifestFiles,
							entrypoints: entrypointFiles
						};
					}
				}),
				new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
			].filter(Boolean),
			// Some libraries import Node modules but don't use them in the browser.
			// Tell webpack to provide empty mocks for them so importing them works.
			node: {
				global: false,
				__filename: false,
				__dirname: false
			},
			// Turn off performance processing because we utilize
			// our own hints via the FileSizeReporter
			performance: {
				// string = 'warning': 'error' | 'warning' boolean: false
				// false 不展示警告或错误提示
				// warning 将展示一条警告，通知你这是体积大的资源。在开发环境，我们推荐这样
				// error 将展示一条错误，通知你这是体积大的资源。在生产环境构建时，我们推荐使用 hints: "error"，有助于防止把体积巨大的 bundle 部署到生产环境，从而影响网页的性能。
				hints: 'warning',
				// 资源(asset)是从 webpack 生成的任何文件。此选项根据单个资源体积(单位: bytes)，控制 webpack 何时生成性能提示
				maxAssetSize: 100000,
				// 入口起点表示针对指定的入口，对于所有资源，要充分利用初始加载时(initial load time)期间。
				// 此选项根据入口起点的最大体积，控制 webpack 何时生成性能提示
				maxEntrypointSize: 400000,
				// 只给出 .js 文件的性能提示
				assetFilter: function(assetFilename) {
					return assetFilename.endsWith('.js');
				}
			}
		},
		envConfig
	);
};
