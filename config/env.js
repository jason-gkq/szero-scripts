'use strict';

import fs from 'fs';
import paths from './paths.js';

// Make sure that including paths.js after env.js will read .env variables.
const { defineConfig: comDefineConfig } = await import(
  `file://${paths.env}/env.com.js`
);
const { defineConfig } = await import(`file://${paths.appEnvConfig}`);

export function getClientEnvironment() {
  const raw = Object.keys(process.env).reduce((env, key) => {
    if (
      [
        'author',
        'BABEL_ENV',
        'NODE_ENV',
        'LANG',
        'npm_package_name',
        'LaunchInstanceID',
        'npm_package_version',
        'npm_lifecycle_event',
        'npm_lifecycle_script',
        'npm_package_main',
        'npm_package_type',
        'publicUrlOrPath',
      ].includes(key)
    ) {
      env[key] = process.env[key];
    }
    return env;
  }, {});

  let productConfig = {
    ENV: process.env.BUILD_ENV,
    buildTime: new Date().getTime(),
  };
  if (fs.existsSync(`${paths.appPackageJson}`)) {
    const packageJsonContent = fs.readFileSync(paths.appPackageJson, 'utf-8');
    const { author, version } = JSON.parse(packageJsonContent);
    productConfig.author = author;
    productConfig.version = version;
  }
  if (fs.existsSync(`${paths.env}/env.com.js`)) {
    Object.assign(productConfig, comDefineConfig && comDefineConfig());
  }
  if (fs.existsSync(`${paths.appEnvConfig}`)) {
    Object.assign(productConfig, defineConfig && defineConfig());
  }

  raw.productConfig = productConfig;
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      if (key == 'productConfig') {
        const { webpackConfig, viteConfig, ...restValue } = raw[key];
        env[key] = JSON.stringify(restValue);
      } else {
        env[key] = JSON.stringify(raw[key]);
      }
      return env;
    }, {}),
  };
  return { raw, stringified };
}

export function getAlias() {
  const alias = {};
  if (fs.existsSync(paths.appTsConfig)) {
    const appTsConfig = fs.readFileSync(paths.appTsConfig, 'utf-8');
    const { compilerOptions } = JSON.parse(appTsConfig);
    Object.keys(compilerOptions.paths || {}).forEach((key) => {
      if (/\/$/.test(compilerOptions.paths[key])) {
        alias[key.trim().slice(0, -1)] =
          paths.appPath +
          '/' +
          compilerOptions.paths[key][0].trim().slice(0, -1);
      } else if (/\/\*$/.test(compilerOptions.paths[key])) {
        alias[key.trim().slice(0, -2)] =
          paths.appPath +
          '/' +
          compilerOptions.paths[key][0].trim().slice(0, -2);
      } else {
        alias[key] = paths.appPath + '/' + compilerOptions.paths[key][0].trim();
      }
    });
  }
  return alias;
}
