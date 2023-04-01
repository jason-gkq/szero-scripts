// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
"use strict";

const fs = require("fs");
// const path = require('path');
const paths = require("./paths");
const proEnv = require("./params");

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve("./paths")];

function getClientEnvironment() {
  const raw = Object.keys(process.env).reduce((env, key) => {
    env[key] = process.env[key];
    return env;
  }, {});

  let productConfig = { ENV: proEnv.env, buildTime: new Date().getTime() };
  if (fs.existsSync(`${paths.appPackageJson}`)) {
    const { author, version } = require(`${paths.appPackageJson}`);
    productConfig.author = author;
    productConfig.version = version;
  }
  if (fs.existsSync(`${paths.env}/env.com.js`)) {
    const { defineConfig } = require(`${paths.env}/env.com.js`);
    Object.assign(productConfig, defineConfig && defineConfig());
  }
  if (fs.existsSync(`${paths.appEnvConfig}`)) {
    const { defineConfig } = require(paths.appEnvConfig);
    Object.assign(productConfig, defineConfig && defineConfig());
  }

  raw.productConfig = productConfig;
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    "process.env": Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

function getAlias() {
  const alias = {};
  if (fs.existsSync(paths.appTsConfig)) {
    const compilerOptions = require(paths.appTsConfig).compilerOptions || {};
    Object.keys(compilerOptions.paths || {}).forEach((key) => {
      if (/\/$/.test(compilerOptions.paths[key])) {
        alias[key.trim().slice(0, -1)] =
          paths.appPath +
          "/" +
          compilerOptions.paths[key][0].trim().slice(0, -1);
      } else if (/\/\*$/.test(compilerOptions.paths[key])) {
        alias[key.trim().slice(0, -2)] =
          paths.appPath +
          "/" +
          compilerOptions.paths[key][0].trim().slice(0, -2);
      } else {
        alias[key] = paths.appPath + "/" + compilerOptions.paths[key][0].trim();
      }
    });
  }
  return alias;
  // return {
  // 	'@assets': `${paths.appPath}/assets`,
  // 	'@src': `${paths.appPath}/src`,
  // 	'@common': `${paths.appPath}/common`,
  // 	'@components': `${paths.appPath}/common/components`,
  // 	'@utils': `${paths.appPath}/common/utils`,
  // 	'@menus': `${paths.appPath}/common/menus`,
  // 	'@locales': `${paths.appPath}/common/locales`,
  // 	'@redux': `${paths.appPath}/common/redux`
  // };
}

module.exports.getClientEnvironment = getClientEnvironment;
module.exports.getAlias = getAlias;
