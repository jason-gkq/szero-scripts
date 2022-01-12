### 简介

本包只适用于`zero-react-pc`、`zero-react-m`两个项目使用

如使用`react` + `redux` + `less`可做参考

安装

```
yarn add zero-react-scripts@0.2.25
```

更新包

```shell
yarn upgrade zero-react-scripts@0.2.17
yarn upgrade zero-react-scripts --latest
```

开发

```shell
yarn start
```

打包

```shell
yarn build:dev
yarn build:uat
yarn build:pre
yarn build:prod
```

### 开发前置准备

1. 环境介绍：

- local 本地开发
- dev 开发环境
- uat 测试环境
- pre 预发布，堡垒环境
- prod 生产环境

2. 在`package.json`中添加 scripts，配置：

```json
{
  "scripts": {
    "start": "zero-react-scripts start env=local",
    "build:dev": "zero-react-scripts build env=dev",
    "build:uat": "zero-react-scripts build env=uat",
    "build:pre": "zero-react-scripts build env=pre",
    "build:prod": "zero-react-scripts build env=prod"
  }
}
```

3. 根目录添加文件夹`env`，文件加重添加如下 5 个`json`文件

- env/env.com.json
- env/env.local.json
- env/env.dev.json
- env/env.uat.json
- env/env.pre.json
- env/env.prod.json

**`env.com.json`为公共业务参数配置文件，其余为各个环境差异性配置**

文件格式必须为 json，如下：

```json
{
  "ENV": "prod",
  "CDN_URL": "//xx.xx.com/apps/<%= appName %>/",
  "SERVICE_URL": "http://xx.xx.com"
}
```

必要参数配置：

- ENV 环境标识
- CDN_URL cdn 路径，如果无，则配置：`/antd-custom-master`
- SERVICE_URL 请求接口域名，以`/`结尾
- appName 为路由前缀
- appCode 项目唯一标识
- theme 项目主体

项目中使用方式为：

```js
const env = process.env.ENV;
const cdnUrl = process.env.CDN_URL;
const authService = process.env.AUTH_SERVICE;
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
      "@/src/*": ["src/*"],
      "@/common": ["zero-react/components"],
      "@/common/*": ["zero-react/components/*"]
    }
  },
  "exclude": ["node_modules", "dist", "dest"]
}
```

5. 依赖包，出去打包需要的一些依赖包，此次打包还进行了`dll`的优化，能在进行业务打包时候跳过这些包的编译，提高打包速度，但对应的文件会在项目启动时候优先加载，进行`dll`打包如下：

- reactvendors
  - react
  - react-dom
  - react-router-dom
- reduxvendors
  - react-redux
  - react-router-redux
  - redux
  - redux-actions
  - redux-batched-actions
  - redux-persist
  - redux-saga
  - redux-thunk
  - reselect

### 其他常用命令介绍

```shell
yarn upgrade --latest

npm publish --tag=beta
```
