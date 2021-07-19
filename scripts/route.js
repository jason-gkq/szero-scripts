"use strict";

const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");

const paths = require("../config/paths");
const { getClientEnvironment } = require("../config/env");
const env = getClientEnvironment();

const appName = env.raw.productConfig.appName;

function listFile(dir, list = []) {
  const arr = fs.readdirSync(dir);
  arr.forEach(function (item) {
    const fullpath = path.join(dir, item);
    const stats = fs.statSync(fullpath);
    if (
      stats.isDirectory() &&
      !fullpath.endsWith("Containers") &&
      !fullpath.endsWith("Components")
    ) {
      listFile(fullpath, list);
    } else {
      if (stats.isFile() && fullpath.endsWith("index.js")) {
        list.push(fullpath);
      }
    }
  });
  return list;
}

function getRoutes() {
  const routes = {'index': [], 'common': []};
  const commonList = listFile(`${paths.appSrc}/common/pages`);
  commonList.forEach((fullPath) => {
    const routePath = fullPath.split("pages")[1].split("/index.js")[0];
    const routePathArr = routePath.split("/");
    const modelName = 'common';
    const chunkName = routePathArr[routePathArr.length - 1];
    // const modelName = /\/\w*\//.exec(routePath)[0].replace(/\//g, "");
    const path = `/${appName}/common` + routePath;
    const component = `$React.lazy(() =>import(/* webpackChunkName: '${chunkName}' */ /* webpackMode: 'lazy' */ '@/common/pages${routePath}'))$`;

    if (!routes[modelName]) {
      routes[modelName] = [];
    }
    routes[modelName].push({
      path,
      component,
    });
  });
  const list = listFile(`${paths.appSrc}/pages`);
  list.forEach((fullPath) => {
    const routePath = fullPath.split("pages")[1].split("/index.js")[0];
    const routePathArr = routePath.split("/");
    const modelName = routePathArr[1];
    const chunkName = routePathArr[routePathArr.length - 1];
    // const modelName = /\/\w*\//.exec(routePath)[0].replace(/\//g, "");
    const path = `/${appName}` + routePath;
    const component = `$React.lazy(() =>import(/* webpackChunkName: '${chunkName}' */ /* webpackMode: 'lazy' */ '@/src/pages${routePath}'))$`;

    if (!routes[modelName]) {
      routes[modelName] = [];
    }
    routes[modelName].push({
      path,
      component,
    });
  });
  return routes;
}
const routes = getRoutes();

const str =
  'import React from "react";export default ' + JSON.stringify(routes);

fs.writeFileSync(
  `${paths.appSrc}/common/navigate/routeData.js`,
  str.replace(/(\"\$)|(\$\")/g, "")
);

spawn.sync(
  'prettier',
  [`${paths.appSrc}/common/navigate/routeData.js`, '--write'],
  { stdio: "inherit", shell: true }
);
