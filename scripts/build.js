"use strict";

process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

const webpack = require("webpack");
// const fs = require("fs");
// const paths = require("../config/paths");
const config = require("../config/webpack/webpack.prod");

let compiler = webpack(config);

new webpack.ProgressPlugin().apply(compiler);

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
  // copyPublicFolder();
});

// function copyPublicFolder() {
//   function callback(err) {
//     if (err) {
//       throw err;
//     }
//     console.log("manifest.json was copied to manifest.json");
//   }
//   fs.copyFile(
//     `${paths.appPublic}/manifest.json`,
//     `${paths.appBuild}/manifest.json`,
//     callback
//   );
// }
