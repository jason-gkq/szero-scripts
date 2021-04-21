module.exports = {
  origin: "https://m.lechebang.com",
  entry: "/home",
  router: {
    index: ["/pages/home", "/pages/system"],
  },
  redirect: {
    notFound: "index",
    accessDenied: "index",
  },
  app: {
    navigationBarTitleText: "miniprogram-project",
  },
  projectConfig: {
    appid: "",
    projectname: "kbone-demo16",
  },
  packageConfig: {
    author: "wechat-miniprogram",
  },
};
