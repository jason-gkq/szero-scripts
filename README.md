### 简介

安装

```
yarn add szero-scripts
```

更新包

```shell
yarn upgrade szero-scripts@1.*.*
yarn upgrade szero-scripts --latest
```

开发

```shell
yarn start
```

打包

```shell
yarn build:test
yarn build:pre
yarn build:prod
```

### 开发前置准备

1. 环境介绍：

- local 本地开发
- test 测试环境
- pre 堡垒环境
- prod 生产环境

2. 在`package.json`中添加 scripts，配置：

```json
{
  "scripts": {
    "start": "szero-scripts start env=local",
    "build:test": "szero-scripts build env=test",
    "build:pre": "szero-scripts build env=pre",
    "build:prod": "szero-scripts build env=prod"
  }
}
```

3. 如果有不同环境的配置，则根目录添加文件夹`env`，文件加重添加对应的`js`文件即可，如果没有配置则无需添加

- env/env.com.js
- env/env.local.js
- env/env.test.js
- env/env.pre.js
- env/env.prod.js

**`env.com.js`为公共业务参数配置文件，其余为各个环境差异性配置**

4. 文件格式如下：

```js
// 配置文件中导出defineConfig则配置信息回自动加载到全局变量中
export const defineConfig = () => ({
  ENV: 'prod',
  appName: 'admin',
  webpackConfig: {
    publicUrlOrPath: '/admin/',
    devServer: {
      port: 8080,
      host: 'localhost',
    },
    privateConfig:{
      headScripts: [
        {
          src: 'https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.common.js',
        },
      ],
      copyOptions: {
        targets: [
          {
            src: 'bin/example.wasm',
            dest: 'wasm-files'
          }
        ]
      }
    }
    build: {},
  },
});
```

必要参数配置：

- ENV 环境标识
- appName 为路由前缀
- webpackConfig webpack 配置项

5. 项目跟目录添加`jsconfing.json`，主要用于`vscode`识别短路径，`webpack`打包会根据`compilerOptions.paths`中的配置转换为`alias`

[处理 alias 转跳问题](https://code.visualstudio.com/docs/languages/jsconfig)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/assets/*": ["assets/*"],
      "@/src/*": ["src/*"]
    }
  }
}
```
