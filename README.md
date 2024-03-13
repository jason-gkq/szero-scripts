### 简介

本脚本适合：`react` + `ts` + `less` 项目进行打包

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

3. 根目录添加文件夹`env`，文件加重添加如下 4 个`js`文件

- env/env.com.js
- env/env.local.js
- env/env.test.js
- env/env.pre.js
- env/env.prod.js

**`env.com.js`为公共业务参数配置文件，其余为各个环境差异性配置**

文件格式如下：

```js
{
  "ENV": "prod"
}
```

必要参数配置：

- ENV 环境标识
- appName 为路由前缀
- appCode 项目唯一标识

项目中使用方式为：

```js
const env = process.env.ENV;
```

4. 项目跟目录添加`jsconfing.json`，主要用于`vscode`识别短路径，`webpack`打包会根据`compilerOptions.paths`中的配置转换为`alias`

[处理 alias 转跳问题](https://code.visualstudio.com/docs/languages/jsconfig)

```json
{
  "compilerOptions": {
    "checkJs": false,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/assets/*": ["assets/*"],
      "@/src/*": ["src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```
