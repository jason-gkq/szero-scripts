#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});
const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");
const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  (x) => x === "build" || x === "start" || x === "buildmp"
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

if (["build", "start", "buildmp"].includes(script)) {
  const appDirectory = fs.realpathSync(process.cwd());
  const before = path.resolve(appDirectory, "src/zero/build/before.js");
  if (fs.existsSync(before)) {
    const beforeResult = spawn.sync(
      process.execPath,
      [].concat(before).concat(args.slice(scriptIndex + 1)),
      { stdio: "inherit" }
    );
    if (beforeResult.status) {
      console.error("run build/before.js failed");
      process.exit(1);
    }
    console.info("run build/before.js finished");
  }

  const result = spawn.sync(
    process.execPath,
    nodeArgs
      .concat(require.resolve("../scripts/" + script))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: "inherit" }
  );
  if (result.signal) {
    if (result.signal === "SIGKILL") {
      console.log(
        "The build failed because the process exited too early. " +
          "This probably means the system ran out of memory or someone called " +
          "`kill -9` on the process."
      );
    } else if (result.signal === "SIGTERM") {
      console.log(
        "The build failed because the process exited too early. " +
          "Someone might have called `kill` or `killall`, or the system could " +
          "be shutting down."
      );
    }
    process.exit(1);
  }
  const after = path.resolve(appDirectory, "src/zero/build/after.js");
  if (fs.existsSync(after)) {
    const afterResult = spawn.sync(
      process.execPath,
      [].concat(after).concat(args.slice(scriptIndex + 1)),
      { stdio: "inherit" }
    );
    if (afterResult.status) {
      console.error("run build/after.js failed");
      process.exit(1);
    }
    console.info("run build/after.js finished");
  }
  process.exit(result.status);
} else {
  console.log('Unknown script "' + script + '".');
  console.log("Perhaps you need to update zero-react-scripts?");
  console.log("See: https://github.com/jason-gkq?tab=projects");
}
