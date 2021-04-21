"use strict";

process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
process.env.application = "web";

process.on("unhandledRejection", (err) => {
  throw err;
});

const webpackDevServer = require("webpack-dev-server");
// const mock = require('cf-mock-server/express-mw')
const webpack = require("webpack");

const config = require("../config/webpack/webpack.dev");
const options = {
  contentBase: config.output.path,
  compress: true,
  hot: true,
  host: "localhost",
  historyApiFallback: true,
  publicPath: "/", // config.output.publicPath.slice(0, -1),
  stats: {
    assets: false,
    entrypoints: false,
    children: false,
    modules: false,
    errors: true,
    errorDetails: true,
    warnings: true,
  },
  // after: (app, server) => {
  //   app.use(
  //     mock({
  //       config: path.join(__dirname, "./mock-server/config.js"),
  //     })
  //   );
  // },
};

webpackDevServer.addDevServerEntrypoints(config, options);
const compiler = webpack(config);
const server = new webpackDevServer(compiler, options);

server.listen(8080, "localhost", () => {
  console.log(
    `Starting server on http://localhost:8080${config.output.publicPath.slice(
      0,
      -1
    )}`
  );
  console.log("dev server listening on port 8080");
});
