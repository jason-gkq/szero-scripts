'use strict';

const paths = require('../paths');
const modules = require('../modules');
const { getClientEnvironment, getAlias } = require('../env');

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

// const ESLintPlugin = require('eslint-webpack-plugin');

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useTypeScript = fs.existsSync(paths.appTsConfig);

module.exports = {
	mode: 'production',
	bail: true,
	devtool: 'source-map',
	entry: {
		main: paths.appIndexJs
	},
	output: {
		hashDigestLength: 8,
		pathinfo: false,
		path: paths.appBuild,
		filename: 'static/pages/[name]/[name].[contenthash].js',
		chunkFilename: 'static/pages/[name]/[name].[contenthash].chunk.js',
		publicPath: paths.publicUrlOrPath,
		devtoolModuleFilenameTemplate: info =>
			path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
		// assetModuleFilename: 'images/[hash][ext][query]',
	},
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
				minifyURLs: true
			}
		}),
		// new webpack.ProvidePlugin({
		//   _: 'lodash',
		//   join: ['lodash', 'join'],
		//  }),
		// new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
		// new InterpolateHtmlPlugin(HtmlWebpackPlugin, {}),
		// new ModuleNotFoundPlugin(path.resolve(__dirname, '..')),

		new webpack.DefinePlugin(env.stringified),
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new MiniCssExtractPlugin({
			filename: 'static/pages/[name]/[name].[contenthash].css',
			chunkFilename: 'static/pages/[name]/[name].[contenthash].chunk.css'
		}),
		new AddAssetHtmlPlugin([
			{
				filepath: `${paths.dllsPath}/*.dll.js`,
				publicPath: `${paths.publicUrlOrPath}static/dll`,
				outputPath: 'static/dll'
			}
		]), // 把dll.js加进index.html里，并且拷贝文件到dist目录
		new webpack.DllReferencePlugin({
			// context: __dirname, // 与DllPlugin中的那个context保持一致
			/** 
          下面这个地址对应webpack.dll.config.js中生成的那个json文件的路径
          这样webpack打包时，会检测此文件中的映射，不会把存在映射的包打包进bundle.js
      **/
			manifest: `${paths.dllsPath}/reactvendors-manifest.json` // 读取dll打包后的manifest.json，分析哪些代码跳过
		}),
		new webpack.DllReferencePlugin({
			// context: __dirname, // 与DllPlugin中的那个context保持一致
			manifest: `${paths.dllsPath}/reduxvendors-manifest.json` // 读取dll打包后的manifest.json，分析哪些代码跳过
		}),
		new ForkTsCheckerWebpackPlugin(),
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
		new WorkboxPlugin.GenerateSW({
			// 这些选项帮助快速启用 ServiceWorkers
			// 不允许遗留任何“旧的” ServiceWorkers
			clientsClaim: true,
			skipWaiting: true
		})
	],
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				terserOptions: {
					parse: {
						ecma: 8
					},
					compress: {
						ecma: 5,
						warnings: false,
						comparisons: false,
						inline: 2
					},
					mangle: {
						safari10: true
					},
					keep_classnames: true,
					keep_fnames: true,
					output: {
						ecma: 5,
						comments: false,
						ascii_only: true
					}
				}
			}),
			new CssMinimizerPlugin({
				parallel: true,
				sourceMap: true,
				minimizerOptions: {
					preset: [
						'default',
						{
							discardComments: { removeAll: true }
						}
					]
				}
			})
		],
		moduleIds: 'deterministic',
		chunkIds: 'deterministic',
		splitChunks: {
			// chunks: 'all',
			// minSize: 20000,
			// minRemainingSize: 0,
			// maxSize: 40000,
			// minChunks: 1,
			// maxAsyncRequests: 30,
			// maxInitialRequests: 30,
			// enforceSizeThreshold: 50000,
			// cacheGroups: {
			//   defaultVendors: {
			//     test: /[\\/]node_modules[\\/]/,
			//     priority: -10,
			//     reuseExistingChunk: true,
			//     filename: 'vendor/[name].[contenthash].chunk.js',
			//   },
			//   default: {
			//     minChunks: 2,
			//     priority: -20,
			//     reuseExistingChunk: true,
			//   },
			// },
			cacheGroups: {
				defaultVendors: {
					test: /[\\/]node_modules[\\/]/,
					filename: 'vendor/[name].[contenthash].chunk.js',
					chunks: 'all'
				}
			}
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
		plugins: [PnpWebpackPlugin]
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
			{ parser: { requireEnsure: false } },
			{
				oneOf: [
					{
						test: /\.(js|mjs|jsx|ts|tsx)$/,
						include: paths.appSrc,
						exclude: /node_modules/,
						loader: require.resolve('babel-loader'),
						options: {
							customize: require.resolve('babel-preset-react-app/webpack-overrides'),
							presets: [
								[
									require('@babel/preset-env').default,
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
									require('@babel/plugin-transform-runtime').default,
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
								require('@babel/plugin-proposal-nullish-coalescing-operator').default
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
									require('@babel/preset-env').default,
									{
										useBuiltIns: 'entry',
										corejs: 3,
										exclude: ['transform-typeof-symbol']
									}
								]
							],
							plugins: [
								[
									require('@babel/plugin-transform-runtime').default,
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
						test: /\.css$/,
						exclude: /\.module\.css$/,
						use: [
							{
								loader: MiniCssExtractPlugin.loader
							},
							{
								loader: require.resolve('css-loader'),
								options: {
									importLoaders: 1,
									sourceMap: true
								}
							},
							{
								loader: require.resolve('postcss-loader'),
								options: {
									sourceMap: true,
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
						test: /\.module\.css$/,
						use: [
							{
								loader: MiniCssExtractPlugin.loader
							},
							{
								loader: require.resolve('css-loader'),
								options: {
									importLoaders: 1,
									sourceMap: true,
									modules: true
								}
							},
							{
								loader: require.resolve('postcss-loader'),
								options: {
									sourceMap: true,
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
						]
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
