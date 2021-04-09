'use strict';

const paths = require('../paths');
const modules = require('../modules');
const { getClientEnvironment, getAlias } = require('../env');

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
module.exports = {
	mode: 'development',
	bail: false,
	devtool: 'cheap-module-source-map',
	entry: {
		main: paths.appIndexJs
	},
	output: {
		// hashDigestLength: 8,
		pathinfo: true,
		path: paths.appBuild,
		filename: 'static/pages/[name]/[name].js',
		chunkFilename: 'static/pages/[name]/[name].chunk.js',
		publicPath: paths.publicUrlOrPath,
		devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: paths.appHtml,
			inject: true
		}),
		new webpack.DefinePlugin(env.stringified),
		new webpack.IgnorePlugin({
			resourceRegExp: /^\.\/locale$/,
			contextRegExp: /moment$/
		}),
		new webpack.HotModuleReplacementPlugin(),
		new ReactRefreshWebpackPlugin(),
		new CaseSensitivePathsPlugin(),
		useTypeScript && new ForkTsCheckerWebpackPlugin(),
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
		})
	].filter(Boolean),
	optimization: {
		minimize: false,
		splitChunks: {
			chunks: 'all',
			name: false
		},
		runtimeChunk: {
			name: entrypoint => `runtime~${entrypoint.name}`
		}
	},
	resolve: {
		// symlinks: false,
		modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
		extensions: paths.moduleFileExtensions
			.map(ext => `.${ext}`)
			.filter(ext => useTypeScript || !ext.includes('ts')),
		// 创建 import 或 require 的别名，来确保模块引入变得更简单。例如，一些位于 src/ 文件夹下的常用模块：
		alias: getAlias(),
		plugins: [PnpWebpackPlugin],
		byDependency: {
			// 更多的配置项可以在这里找到 https://webpack.js.org/configuration/resolve/
			less: {
				mainFiles: ['custom']
			}
		}
	},
	resolveLoader: {
		plugins: [PnpWebpackPlugin.moduleLoader(module)]
	},
	node: {
		global: false,
		__filename: false,
		__dirname: false
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
						loader: require.resolve('babel-loader'),
						options: {
							// customize: require.resolve('babel-preset-react-app/webpack-overrides'),
							presets: [
								[
									require('@babel/preset-env'),
									{
										useBuiltIns: 'entry',
										corejs: 3,
										exclude: ['transform-typeof-symbol']
									}
								],
								[
									require('@babel/preset-react').default,
									{
										development: false,
										useBuiltIns: true,
										runtime: 'automatic'
									}
								],
								[require('@babel/preset-typescript').default]
							],
							babelrc: false,
							configFile: false,
							plugins: [
								[require('@babel/plugin-transform-flow-strip-types').default, false],
								require('babel-plugin-macros'),
								[require('@babel/plugin-proposal-decorators').default, false],
								[
									require('@babel/plugin-proposal-class-properties').default,
									{
										loose: true
									}
								],
								require('@babel/plugin-proposal-numeric-separator').default,
								[
									require('@babel/plugin-transform-runtime'),
									{
										corejs: false,
										helpers: true,
										version: require('@babel/runtime/package.json').version,
										regenerator: true,
										useESModules: true,
										absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json'))
									}
								],
								[
									require('babel-plugin-transform-react-remove-prop-types').default,
									{
										removeImport: true
									}
								],
								require('@babel/plugin-proposal-optional-chaining').default,
								require('@babel/plugin-proposal-nullish-coalescing-operator').default,
								require.resolve('react-refresh/babel')
							].filter(Boolean),
							overrides: [
								{
									exclude: /\.tsx?$/,
									plugins: [require('@babel/plugin-transform-flow-strip-types').default]
								},
								{
									test: /\.tsx?$/,
									plugins: [[require('@babel/plugin-proposal-decorators').default, { legacy: true }]]
								}
							].filter(Boolean),
							cacheDirectory: true,
							cacheCompression: false,
							compact: true
						}
					},
					{
						test: /\.(js|mjs)$/,
						exclude: /@babel(?:\/|\\{1,2})runtime/,
						loader: require.resolve('babel-loader'),
						options: {
							babelrc: false,
							configFile: false,
							compact: false,
							presets: [
								[
									require('@babel/preset-env'),
									{
										useBuiltIns: 'entry',
										corejs: 3,
										exclude: ['transform-typeof-symbol']
									}
								]
							],
							plugins: [
								[
									require('@babel/plugin-transform-runtime'),
									{
										corejs: false,
										helpers: true,
										version: require('@babel/runtime/package.json').version,
										regenerator: true,
										useESModules: true,
										absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json'))
									}
								],
								[
									'@babel/plugin-proposal-decorators',
									{
										legacy: true
									}
								],
								'@babel/plugin-proposal-class-properties'
							].filter(Boolean),
							cacheDirectory: true,
							cacheCompression: false,
							sourceMaps: true,
							inputSourceMap: true
						}
					},
					{
						test: /\.(less|css)$/,
						use: [
							require.resolve('style-loader'),
							{
								loader: require.resolve('css-loader'),
								options: {
									importLoaders: 1,
									sourceMap: true
								}
							},
							{
								loader: 'less-loader',
								options: {
									lessOptions: {
										strictMath: false,
										javascriptEnabled: true
									}
								}
							},
							{
								loader: require.resolve('postcss-loader'),
								options: {
									sourceMap: true,
									// parser: 'sugarss',
									postcssOptions: {
										plugins: () => [
											require('postcss-flexbugs-fixes'),
											require('postcss-preset-env')({
												autoprefixer: {
													flexbox: 'no-2009'
												},
												stage: 3
											}),
											postcssNormalize()
										]
									}
								}
							}
						],
						sideEffects: true
					},
					{
						test: /\.(png|jpg|jpeg|gif)$/,
						type: 'asset/resource',
						generator: {
							filename: 'static/media/[hash][ext][query]'
						}
					},
					{
						test: /\.svg$/,
						type: 'asset/inline'
					},
					{
						test: /\.(pdf|txt)$/,
						type: 'asset',
						generator: {
							filename: 'static/media/[hash][ext][query]'
						}
					}
					// {
					//   test: require.resolve('../src/common/globals.js'),
					//   use:
					//     'exports-loader?type=commonjs&exports=file,multiple|helpers.parse|parse',
					// },
				]
			}
		]
	}
};
