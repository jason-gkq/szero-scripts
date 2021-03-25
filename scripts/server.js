const webpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('./webpack.dev.js');
const options = {
	contentBase: config.output.path,
	hot: true,
	host: 'localhost',
	publicPath: config.output.publicPath.slice(0, -1)
};

webpackDevServer.addDevServerEntrypoints(config, options);
const compiler = webpack(config);
const server = new webpackDevServer(compiler, options);

server.listen(5000, 'localhost', () => {
	console.log('dev server listening on port 5000');
});
