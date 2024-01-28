'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

import webpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import config from '../config/webpack/webpack.dev.js';
import paths from '../config/paths.js';
import { getClientEnvironment } from '../config/env.js';

const {
  raw: { productConfig },
} = getClientEnvironment();

const { devServer = { port: 8080, host: 'localhost' } } =
  productConfig.webpackConfig || {};

const options = {
  static: paths.appBuild,
  compress: true,
  hot: true,
  client: false,
  historyApiFallback: true, // 一定要加上，不然浏览器输入指定页面会发起GET请求，而不是加载页面
  // historyApiFallback: { // 多入口配置
  //   rewrites: [
  //     { from: /^\/$/, to: '/views/landing.html' },
  //     { from: /^\/subpage/, to: '/views/subpage.html' },
  //     { from: /./, to: '/views/404.html' },
  //   ],
  // },
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  },
  client: {
    logging: 'warn',
    overlay: true,
    progress: true,
    reconnect: 3,
  },
  ...devServer,
};

const compiler = webpack(config);
const server = new webpackDevServer(options, compiler);

server.startCallback(() => {
  console.log(`Starting server on http://${devServer.host}:${devServer.port}`);
});
