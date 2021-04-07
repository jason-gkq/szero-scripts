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
