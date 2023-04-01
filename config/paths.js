"use strict";

const path = require("path");
const fs = require("fs");

const proEnv = require("./params");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

let publicUrlOrPath = "/";

const envComFilePath = `${resolveApp("env")}/env.com.js`;
const envFilePath = `${resolveApp("env")}/env.${proEnv.env}.js`;

if (fs.existsSync(envComFilePath)) {
  const { defineConfig } = require(envComFilePath);
  const { webpackConfig } = defineConfig && defineConfig();
  const { publicUrlOrPath: publicUrlOrPathC } = webpackConfig || {};
  if (publicUrlOrPathC) {
    publicUrlOrPath = publicUrlOrPathC;
  }
}

if (fs.existsSync(envFilePath)) {
  const { defineConfig } = require(envFilePath);
  const { webpackConfig } = defineConfig && defineConfig();
  const { publicUrlOrPath: publicUrlOrPathC } = webpackConfig || {};
  if (publicUrlOrPathC) {
    publicUrlOrPath = publicUrlOrPathC;
  }
}

process.env.publicUrlOrPath = publicUrlOrPath;

const buildPath = "dist";

const moduleFileExtensions = ["js", "jsx", "ts", "tsx", "css", "less", "json"];

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find((extension) =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

const resolveOwn = (relativePath) =>
  path.resolve(__dirname, "..", relativePath);

// config before eject: we're in ./node_modules/react-scripts/config/
module.exports = {
  env: resolveApp("env"),
  appPath: resolveApp("."),
  appBuild: resolveApp(buildPath),
  appPublic: resolveApp("public"),
  appHtml: resolveApp("public/index.html"),
  appIndexJs: resolveModule(resolveApp, "src/index"),
  appPackageJson: resolveApp("package.json"),
  appSrc: resolveApp("src"),
  appTsConfig: resolveApp("tsconfig.json"),
  appEnvConfig: resolveApp(`env/env.${proEnv.env}.js`),
  yarnLockFile: resolveApp("yarn.lock"),
  // testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  // proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp("node_modules"),
  swSrc: resolveModule(resolveApp, "src/serviceWorker"),
  publicUrlOrPath,
  // These properties only exist before ejecting:
  ownPath: resolveOwn("."),
  ownNodeModules: resolveOwn("node_modules"), // This is empty on npm 3
  appTypeDeclarations: resolveApp("src/global.d.ts"),
  dllsPath: resolveOwn("dll"),
  dllOutputPath: resolveOwn("dll/*.dll.js"),
};

module.exports.moduleFileExtensions = moduleFileExtensions;
