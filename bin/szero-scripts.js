#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});
// import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import spawn from 'cross-spawn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

const scriptIndex = args.findIndex((x) => x === 'build' || x === 'start');
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];
const params = args.slice(scriptIndex + 1);

if (['build', 'start'].includes(script)) {
  if (params.length > 0) {
    params.forEach((p) => {
      const tmpArg = p.trim().split('=');
      if (tmpArg.length == 2) {
        if (tmpArg[0] == 'env') {
          process.env.BUILD_ENV = tmpArg[1];
        } else {
          process.env[tmpArg[0].replace(/\W+/g, '')] = tmpArg[1];
        }
      }
    });
  }

  if (script == 'start') {
    process.env.BABEL_ENV = 'development';
    process.env.NODE_ENV = 'development';
  } else {
    process.env.BABEL_ENV = 'production';
    process.env.NODE_ENV = 'production';
  }

  const result = spawn.sync(
    process.execPath,
    nodeArgs
      .concat(path.resolve(__dirname, '../scripts/' + script + '.js'))
      .concat(params),
    { stdio: 'inherit' }
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      );
    }
    process.exit(1);
  }
  process.exit(result.status);
} else {
  console.log('Unknown script "' + script + '".');
  console.log('Perhaps you need to update szero-scripts?');
  console.log('See: https://github.com/jason-gkq?tab=projects');
}