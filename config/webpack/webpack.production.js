'use strict';

const path = require('path');
const fs = require('fs');
const resolve = require('resolve');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const postcssNormalize = require('postcss-normalize');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');

const TerserPlugin = require('terser-webpack-plugin');

// common function to get style loaders
const getStyleLoaders = ({ cssOptions, preProcessor = null, shouldUseSourceMap, paths }) => {
	const loaders = [
		{
			loader: MiniCssExtractPlugin.loader,
			options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {}
		},
		{
			loader: require.resolve('css-loader'),
			options: cssOptions
		},
		{
			loader: require.resolve('postcss-loader'),
			options: {
				sourceMap: shouldUseSourceMap,
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
	].filter(Boolean);
	if (preProcessor) {
		loaders.push(
			{
				loader: require.resolve('resolve-url-loader'),
				options: {
					sourceMap: shouldUseSourceMap,
					root: paths.appSrc
				}
			},
			{
				loader: require.resolve(preProcessor),
				options: {
					sourceMap: shouldUseSourceMap
				}
			}
		);
	}
	return loaders;
};

const getJsLoaders = ({ paths, hasJsxRuntime, shouldUseSourceMap }) => {
	return [
		{
			test: /\.(js|mjs|jsx|ts|tsx)$/,
			include: paths.appSrc,
			loader: require.resolve('babel-loader'),
			options: {
				customize: require.resolve('babel-preset-react-app/webpack-overrides'),
				presets: [
					[
						require.resolve('babel-preset-react-app'),
						{
							runtime: hasJsxRuntime ? 'automatic' : 'classic'
						}
					]
				],
				// @remove-on-eject-begin
				// .babelrc.json or .babelrc files are loaded relative to the file being compiled.
				// If this option is omitted, Babel will behave as if babelrc: false has been set.
				babelrc: false,
				// Defaults to searching for a default babel.config.json file,
				// but can be passed the path of any JS or JSON5 config file.
				configFile: false,
				// Make sure we have a unique cache identifier, erring on the
				// side of caution.
				// We remove this when the user ejects because the default
				// is sane and uses Babel options. Instead of options, we use
				// the react-scripts and babel-preset-react-app versions.
				cacheIdentifier: getCacheIdentifier('production', [
					'babel-plugin-named-asset-import',
					'babel-preset-react-app',
					'react-dev-utils',
					'zero-react-scripts'
				]),
				// @remove-on-eject-end
				plugins: [
					[
						require.resolve('babel-plugin-named-asset-import'),
						{
							loaderMap: {
								svg: {
									ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]'
								}
							}
						}
					]
				].filter(Boolean),
				// This is a feature of `babel-loader` for webpack (not Babel itself).
				// It enables caching results in ./node_modules/.cache/babel-loader/
				// directory for faster rebuilds.
				cacheDirectory: true,
				// See #6846 for context on why cacheCompression is disabled
				// 默认值为 true。当设置此值时，会使用 Gzip 压缩每个 Babel transform 输出。
				// 如果你想要退出缓存压缩，将它设置为 false
				// -- 如果你的项目中有数千个文件需要压缩转译，那么设置此选项可能会从中收益。
				cacheCompression: false,
				// 是否压缩
				compact: true
			}
		},
		// Process any JS outside of the app with Babel.
		// Unlike the application JS, we only compile the standard ES features.
		{
			test: /\.(js|mjs)$/,
			exclude: /@babel(?:\/|\\{1,2})runtime/,
			loader: require.resolve('babel-loader'),
			options: {
				babelrc: false,
				configFile: false,
				compact: false,
				presets: [[require.resolve('babel-preset-react-app/dependencies'), { helpers: true }]],
				// cacheDirectory: 默认值为 false。当有设置时，指定的目录将用来缓存 loader 的执行结果。
				// 之后的 webpack 构建，将会尝试读取缓存，来避免在每次执行时，
				// 可能产生的、高性能消耗的 Babel 重新编译过程(recompilation process)。
				// 如果设置了一个空值 (loader: 'babel-loader?cacheDirectory')
				// 或者 true (loader: 'babel-loader?cacheDirectory=true')，
				// loader 将使用默认的缓存目录 node_modules/.cache/babel-loader，
				// 如果在任何根目录下都没有找到 node_modules 目录，将会降级回退到操作系统默认的临时文件目录。
				cacheDirectory: true,
				// See #6846 for context on why cacheCompression is disabled
				// cacheCompression:  默认值为 true。当设置此值时，会使用 Gzip 压缩每个 Babel transform 输出。
				// 如果你想要退出缓存压缩，将它设置为 false
				// -- 如果你的项目中有数千个文件需要压缩转译，那么设置此选项可能会从中收益。
				cacheCompression: false,
				// @remove-on-eject-begin
				cacheIdentifier: getCacheIdentifier('production', [
					'babel-plugin-named-asset-import',
					'babel-preset-react-app',
					'react-dev-utils',
					'zero-react-scripts'
				]),
				// @remove-on-eject-end
				// Babel sourcemaps are needed for debugging into node_modules
				// code.  Without the options below, debuggers like VSCode
				// show incorrect code and set breakpoints on the wrong lines.
				sourceMaps: shouldUseSourceMap,
				inputSourceMap: shouldUseSourceMap
			}
		}
	];
};

const getEnvConfig = ({ paths, env, shouldInlineRuntimeChunk, useTypeScript, disableESLintPlugin, hasJsxRuntime }) => {
	return {
		mode: 'production',
		bail: true,
		devtool: 'source-map',
		context: paths.appSrc,
		entry: {
			reactvendors: { import: ['react', 'react-dom', 'react-router'], runtime: 'runtime' },
			reduxvendors: {
				import: [
					'react-redux',
					'react-router-redux',
					'redux',
					'redux-actions',
					'redux-mock-store',
					'redux-saga',
					'redux-thunk',
					'reselect'
				],
				runtime: 'runtime'
			},
			main: { import: './index.js', dependOn: ['reactvendors', 'reduxvendors'] }
		},
		// entry: paths.appIndexJs,
		output: {
			hashDigestLength: 8,
			path: paths.appBuild,
			pathinfo: false,
			filename: 'static/js/[name].[contenthash:8].js',
			chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
			publicPath: paths.publicUrlOrPath,
			devtoolModuleFilenameTemplate: info =>
				path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/'),
			globalObject: 'this'
		},
		optimization: {
			minimize: true,
			minimizer: [
				// This is only used in production mode
				new TerserPlugin({
					// 是否将注释剥离到单独的文件中
					// 启用/禁用剥离注释功能。
					extractComments: true,
					terserOptions: {
						parse: {
							// We want terser to parse ecma 8 code. However, we don't want it
							// to apply any minification steps that turns valid ecma 5 code
							// into invalid ecma 5 code. This is why the 'compress' and 'output'
							// sections only apply transformations that are ecma 5 safe
							// https://github.com/facebook/create-react-app/pull/4234
							ecma: 8
						},
						compress: {
							ecma: 5,
							warnings: false,
							// Disabled because of an issue with Uglify breaking seemingly valid code:
							// https://github.com/facebook/create-react-app/issues/2376
							// Pending further investigation:
							// https://github.com/mishoo/UglifyJS2/issues/2011
							comparisons: false,
							// Disabled because of an issue with Terser breaking valid code:
							// https://github.com/facebook/create-react-app/issues/5250
							// Pending further investigation:
							// https://github.com/terser-js/terser/issues/120
							inline: 2
						},
						mangle: {
							safari10: true
						},
						// Added for profiling in devtools
						keep_classnames: false,
						keep_fnames: false,
						output: {
							ecma: 5,
							comments: false,
							// Turned on because emoji and regex is not minified properly using default
							// https://github.com/facebook/create-react-app/issues/2488
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
					// minify: async (data, inputMap) => {
					//   const csso = require('csso');
					//   const sourcemap = require('source-map');

					//   const [[filename, input]] = Object.entries(data);
					//   const minifiedCss = csso.minify(input, {
					//     filename: filename,
					//     sourceMap: true,
					//   });

					//   if (inputMap) {
					//     minifiedCss.map.applySourceMap(
					//       new sourcemap.SourceMapConsumer(inputMap),
					//       filename
					//     );
					//   }

					//   return {
					//     css: minifiedCss.css,
					//     map: minifiedCss.map.toJSON(),
					//   };
					// },
				})
			],
			splitChunks: {
				chunks: 'all',
				name: false
			},
			runtimeChunk: {
				name: entrypoint => `runtime-${entrypoint.name}`
			}
		},
		plugins: [
			new HtmlWebpackPlugin({
				inject: true,
				template: paths.appHtml,
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
			shouldInlineRuntimeChunk && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
			new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
			new MiniCssExtractPlugin({
				filename: 'static/css/[name].[contenthash:8].css',
				chunkFilename: 'static/css/[name].[chunkhash:8].chunk.css'
			}),
			fs.existsSync(paths.swSrc) &&
				new WorkboxWebpackPlugin.InjectManifest({
					swSrc: paths.swSrc,
					dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
					exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
				}),
			useTypeScript &&
				new ForkTsCheckerWebpackPlugin({
					typescript: resolve.sync('typescript', {
						basedir: paths.appNodeModules
					}),
					async: false,
					checkSyntacticErrors: true,
					resolveModuleNameModule: process.versions.pnp ? `${__dirname}/pnpTs.js` : undefined,
					resolveTypeReferenceDirectiveModule: process.versions.pnp ? `${__dirname}/pnpTs.js` : undefined,
					tsconfig: paths.appTsConfig,
					reportFiles: [
						'../**/src/**/*.{ts,tsx}',
						'**/src/**/*.{ts,tsx}',
						'!**/src/**/__tests__/**',
						'!**/src/**/?(*.)(spec|test).*',
						'!**/src/setupProxy.*',
						'!**/src/setupTests.*'
					],
					silent: true,
					formatter: typescriptFormatter
				}),
			!disableESLintPlugin &&
				new ESLintPlugin({
					// Plugin options
					extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
					formatter: require.resolve('react-dev-utils/eslintFormatter'),
					eslintPath: require.resolve('eslint'),
					emitWarning: false,
					context: paths.appSrc,
					cache: true,
					cacheLocation: path.resolve(paths.appNodeModules, '.cache/.eslintcache'),
					cwd: paths.appPath,
					resolvePluginsRelativeTo: __dirname,
					baseConfig: {
						extends: [require.resolve('eslint-config-react-app/base')],
						rules: {
							...(!hasJsxRuntime && {
								'react/react-in-jsx-scope': 'error'
							})
						}
					}
				})
		].filter(Boolean)
	};
};

module.exports = {
	getEnvConfig,
	getStyleLoaders,
	getJsLoaders
};
