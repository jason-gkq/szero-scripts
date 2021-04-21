"use strict";

process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

process.on("unhandledRejection", (err) => {
  throw err;
});
const webpack = require("webpack");

const config = require("../config/webpack/webpack.mp.prod");

let compiler = webpack(config);

new webpack.ProgressPlugin({
  activeModules: false,
  entries: true,
  handler(percentage, message, ...args) {
    // e.g. Output each progress message directly to the console:
    // console.info(percentage, message, ...args);
  },
  modules: true,
  modulesCount: 5000,
  profile: false,
  dependencies: true,
  dependenciesCount: 10000,
  percentBy: null,
}).apply(compiler);

compiler.run(function (err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
});
