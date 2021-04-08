### 安装
```
yarn add zero-react-scripts@0.2.0
```

### 配置
在`package.json`中添加homepage和scripts，配置：
```json
{
  "homepage": "/lcbtest/",
  "scripts": {
		"start": "zero-react-scripts start env=local",
		"build:dev": "zero-react-scripts build env=dev",
		"build:uat": "zero-react-scripts build env=uat",
		"build:pre": "zero-react-scripts build env=pre",
		"build:prod": "zero-react-scripts build env=prod",
	}
}
```
文件为分环境打包，分为：
  - local 本地开发
  - dev 开发环境
  - uat 测试环境
  - pre 预发布，堡垒环境
  - prod 生产环境

4个环境变量打包上无差别，只是读取不同环境的业务参数配置   
配置文件放在跟目录下`env`文件夹下的json文件，分别对应：
  - local env/env.local.json
  - dev env/env.dev.json
  - uat env/env.uat.json
  - pre env/env.pre.json
  - prod env/env.prod.json

文件格式必须为json，如下：
```json
{
  "ENV": "prod",
  "CDN_URL": "//xx.xx.com/apps/<%= appName %>/",
  "AUTH_SERVICE": "http://xx.xx.com"
}
```
项目中使用方式为：
```js
const env = process.env.ENV;
const cdnUrl = process.env.CDN_URL;
const authService = process.env.AUTH_SERVICE;
```

### 添加`jsconfing.json`
webpack打包时添加了路径映射alias，但在项目vscode中可能无法识别，添加jsconfig.json主要用于vscode识别短路径
```json
{
  /**
    处理alias转跳问题
    https://code.visualstudio.com/docs/languages/jsconfig
  **/
  "compilerOptions": {
    "checkJs": false,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@assets/*": ["assets/*"],
      "@src/*": ["src/*"],
      "@components": ["zero-react/components"],
      "@components/*": ["zero-react/components/*"],
      "@utils": ["zero-react/utils"],
      "@utils/*": ["zero-react/utils/*"],
      "@menus/*": ["zero-react/menus/*"],
      "@locales/*": ["zero-react/locales/*"],
    }
  },
  "exclude": ["node_modules", "dist", "dest"]
}
```
## NPM 包介绍

```json
{
  "@babel/cli": "^7.12.10",
  "@babel/core": "^7.12.10",
  "@babel/plugin-proposal-class-properties": "^7.12.1", // webpack 打包class注解支持
  "@babel/plugin-proposal-decorators": "^7.12.12", // webpack 打包function 注解支持
  "@babel/plugin-transform-runtime": "^7.12.10",
  "@babel/polyfill": "^7.12.1",
  "@babel/preset-env": "^7.12.11",
  "@babel/preset-react": "^7.12.10",
  "@babel/runtime": "^7.12.5",
  "babel-loader": "^8.2.2",
  "babel-polyfill": "^6.26.0",
  "clean-webpack-plugin": "^3.0.0", // 清理dest打包文件
  "css-loader": "^5.0.1", // webpack 对css支持，配合 style-loader 或者 mini-css-extract-plugin 使用
  "eslint-config-prettier": "^7.2.0", // 支持 eslint 继承 prettier 配置支持
  "file-loader": "^6.2.0", // webpack对静态资源的支持，webpack5中将【淘汰】
  "html-webpack-plugin": "^4.5.1", // webpack 编辑 index.html
  "less-loader": "^7.3.0", // webpack 打包支持对 less 支持
  "mini-css-extract-plugin": "^1.3.5", // webpack 压缩css代码插件，生产、堡垒和测试环境参数要求，则压缩，替换style-loader
  "prettier": "^2.2.1", // 代码格式化
  "style-loader": "^2.0.0", // webpack 非压缩css时，作为css的第一个处理loader
  "ts-loader": "^8.0.14", // webpack 打包对ts支持
  "typescript": "^4.1.3", // webpack 打包对ts支持
  "uglifyjs-webpack-plugin": "^2.2.0",
  "url-loader": "^4.1.1", // webpack 打包对文件支持，webpack5中将【淘汰】
  "webpack": "^5.19.0", //
  "webpack-bundle-analyzer": "^4.4.0", // webpack 的分析工具
  "webpack-cli": "^4.4.0", // webpack 命令行工具
  "webpack-dev-server": "^3.11.2", // 开发环境的server启动
  "webpack-merge": "^5.7.3" // 用于 webpack 打包配置合并
}
```
