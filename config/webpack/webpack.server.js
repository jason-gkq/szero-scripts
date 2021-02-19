'use strict';
const fs = require('fs');
const resolve = require('resolve');

const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const postcssNormalize = require('postcss-normalize');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');

const ESLintPlugin = require('eslint-webpack-plugin');
const webpackDevClientEntry = require.resolve('react-dev-utils/webpackHotDevClient');
const reactRefreshOverlayEntry = require.resolve('react-dev-utils/refreshOverlayInterop');
const path = require('path');

// common function to get style loaders
const getStyleLoaders = ({ cssOptions, preProcessor = null, shouldUseSourceMap, paths }) => {
	const loaders = [
		{
			loader: require.resolve('style-loader')
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

const getJsLoaders = ({ paths, env, hasJsxRuntime, shouldUseSourceMap }) => {
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
				babelrc: false,
				configFile: false,
				// Make sure we have a unique cache identifier, erring on the
				// side of caution.
				// We remove this when the user ejects because the default
				// is sane and uses Babel options. Instead of options, we use
				// the react-scripts and babel-preset-react-app versions.
				cacheIdentifier: getCacheIdentifier('development', [
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
					],
					env.raw.FAST_REFRESH && require.resolve('react-refresh/babel')
				].filter(Boolean),
				// This is a feature of `babel-loader` for webpack (not Babel itself).
				// It enables caching results in ./node_modules/.cache/babel-loader/
				// directory for faster rebuilds.
				cacheDirectory: true,
				// See #6846 for context on why cacheCompression is disabled
				cacheCompression: false,
				compact: false
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
				cacheDirectory: true,
				// See #6846 for context on why cacheCompression is disabled
				cacheCompression: false,
				// @remove-on-eject-begin
				cacheIdentifier: getCacheIdentifier('development', [
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

const getEnvConfig = ({ paths, env, useTypeScript, disableESLintPlugin, hasJsxRuntime }) => {
	return {
		mode: 'development',
		bail: false,
		devtool: 'cheap-module-source-map',
		entry: [webpackDevClientEntry, paths.appIndexJs],
		output: {
			path: paths.appBuild,
			pathinfo: true,
			filename: 'static/js/[name].js',
			chunkFilename: 'static/js/[name].chunk.js',
			publicPath: paths.publicUrlOrPath,
			devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
			globalObject: 'this'
		},
		optimization: {
			minimize: false,
			minimizer: [],
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
				template: paths.appHtml
			}),
			new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
			new webpack.HotModuleReplacementPlugin(),
			env.raw.FAST_REFRESH &&
				new ReactRefreshWebpackPlugin({
					overlay: {
						entry: webpackDevClientEntry,
						// The expected exports are slightly different from what the overlay exports,
						// so an interop is included here to enable feedback on module-level errors.
						module: reactRefreshOverlayEntry,
						// Since we ship a custom dev client and overlay integration,
						// the bundled socket handling logic can be eliminated.
						sockIntegration: false
					}
				}),
			new CaseSensitivePathsPlugin(),
			new WatchMissingNodeModulesPlugin(paths.appNodeModules),
			useTypeScript &&
				new ForkTsCheckerWebpackPlugin({
					typescript: resolve.sync('typescript', {
						basedir: paths.appNodeModules
					}),
					async: true,
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
					formatter: undefined
				}),
			!disableESLintPlugin &&
				new ESLintPlugin({
					// Plugin options
					extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
					formatter: require.resolve('react-dev-utils/eslintFormatter'),
					eslintPath: require.resolve('eslint'),
					emitWarning: true,
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
		].filter(Boolean),
		performance: false
	};
};

module.exports = {
	getEnvConfig,
	getStyleLoaders,
	getJsLoaders
};
