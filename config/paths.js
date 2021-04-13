"use strict";

const path = require("path");
const fs = require("fs");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const publicUrlOrPath = require(resolveApp("package.json")).homepage || "/";

const buildPath = "dest";

const moduleFileExtensions = ["js", "ts", "tsx", "json", "jsx", "css", "less"];

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
  // appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp("jsconfig.json"),
  yarnLockFile: resolveApp("yarn.lock"),
  // testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  // proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp("node_modules"),
  swSrc: resolveModule(resolveApp, "src/service-worker"),
  publicUrlOrPath,
  // These properties only exist before ejecting:
  ownPath: resolveOwn("."),
  ownNodeModules: resolveOwn("node_modules"), // This is empty on npm 3
  appTypeDeclarations: resolveApp("src/react-app-env.d.ts"),
  ownTypeDeclarations: resolveOwn("lib/react-app.d.ts"),
  dllsPath: resolveOwn("dll"),
  dllOutputPath: resolveOwn("dll/*.dll.js"),
};

module.exports.moduleFileExtensions = moduleFileExtensions;
