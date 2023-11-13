/**
 * 使用方法:
 * 1:window环境:配置系统环境变量NODE_PATH(为了可以require({全局安装模块}))，例如: NODE_PATH: C:\Users\baoguojie\AppData\Roaming\npm\node_modules
 * 2:linux环境:安装nodejs版本8.0以上(为了支持async function使用)
 * 3.在项目根目录下执行:node init.js
 */

const overwriteFiles = [
    ".editorconfig",
    ".npmignore",
    ".stylelintrc",
    ".travis.yml",
    "angular.json",
    "package.json",
    "protractor.conf.js",
    "README.md",
    "tsconfig.json",
    "webpack.extra.js",
];
const otherFiles = ["tslint.json"];
const overwriteFolders = ["framework"];
const notRewriteFolders = ["_mock", "_nginx", "e2e", "environments", "pages"];

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const execAsync = require("child_process").exec;
const execSync = require("child_process").execSync;
const root = path.resolve(__dirname).replace(/\\/g, "/");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const envNames = ["local", "dev", "test", "prod"];
const frameworkName = "framework";
let envName;
let admzip;
let answer;
const params = getParams();
(async function main() {
    await installAdmZip();
    try {
        // 无命令行参数，执行界面交互
        if (
            params["env"] &&
            params["env"].trim() !== "" &&
            contains(envNames, params["env"])
        ) {
            if (["test1", "test2", "test3", "test4"].includes(params["env"])) {
                envName = "test";
            } else if (
                ["dev1", "dev2", "dev3", "dev4"].includes(params["env"])
            ) {
                envName = "dev";
            } else {
                envName = params["env"];
            }
        } // 有命令行参数，不执行界面交互
        else {
            console.log(
                "Which environment do you want the application to be initialized in?"
            );
            envNames.forEach((opt, index) => {
                console.log(`  [${index}] ${opt}`);
            });
            console.log(
                `  Your choice [0-${envNames.length - 1}, or "q" to quit] `
            );
            answer = await getInputAnswer();
            if (!isPositiveInteger(answer, envNames.length - 1)) {
                failInitExit("Quit initialization");
            } else {
                if (envNames[answer]) {
                    envName = envNames[answer];
                }
            }
        }
        // 获取版本号
        let branch = getBranch(root);

        console.log("GetFrameworkFromGit");
        await getFrameworkFromGit(root, branch);
        try {
            admzip = require("adm-zip");
        } catch (e) {
            execSync("cnpm -g install adm-zip@0.4.7");
            admzip = require("adm-zip");
        }
        unzip(`${root}/tmp-init.zip`, `${root}/`);
        const srcExist = fs.existsSync(`${root}/tmp-init/${frameworkName}`);
        const jsonPackageExist = fs.existsSync(`${root}/tmp-init/package.json`);
        if (!srcExist || !jsonPackageExist) {
            failInitExit("This is a damaged framework, init fail");
        }
        // 是否覆盖
        const flag = params["overwrite"] || true;
        copyFileSync(`${root}/tmp-init/.gitignore`, `${root}/`, true);
        // package-lock 不提交git
        fs.writeFileSync(`${root}/.gitignore`, `package-lock.json \n`, {
            flag: "a",
            encoding: "utf-8",
            mode: "0666",
        });
        // 业务代码不覆盖
        await batchCopyFolder(notRewriteFolders, false);
        // 框架代码覆盖,更新前先把原有framework文件夹删除
        await batchCopyFolder(overwriteFolders, true);
        // 修改index.html文件base标签中的href值
        await batchCopyFile(overwriteFiles, true);
        await batchCopyFile(otherFiles, flag);
        await makeIndex(envName);
        console.log("Update completion");

        const exist = fs.existsSync(`${root}/.git/hooks`);
        if (!exist) {
            copyFolderSync(`${root}/tmp-init/hooks`, `${root}/.git/`);
        }
        // 清理多余文件
        console.log("Clean up the file.");
        fs.unlinkSync(`${root}/tmp-init.zip`);
        deleteFolder(`${root}/tmp-init`);
        // await installPackage();
        console.log("Init Success!");
        process.exit(0);
    } catch (err) {
        failInitExit(err);
    }
})();

// 批量复制文件夹
function batchCopyFolder(folders, overwrite) {
    folders.forEach((item) => {
        const exist = fs.existsSync(`${root}/${item}`);
        if (overwrite) {
            if (exist) {
                fs.renameSync(`${root}/${item}`, `${root}/tmpSrc`);
                deleteFolder(`${root}/tmpSrc`);
            }
            copyFolderSync(`${root}/tmp-init/${item}`, `${root}/`);
            fs.writeFileSync(`${root}/.gitignore`, `/${item} \n`, {
                flag: "a",
                encoding: "utf-8",
                mode: "0666",
            });
            console.log(`${item} update completion.`);
        } else {
            if (exist) {
                console.log(`${item} folder has already exist.`);
            } else {
                copyFolderSync(`${root}/tmp-init/${item}`, `${root}/`);
                console.log(`${item} folder create completion.`);
            }
        }
    });
}

// 批量复制文件
function batchCopyFile(files, overwrite) {
    files.forEach((item) => {
        copyFileSync(`${root}/tmp-init/${item}`, `${root}/`, overwrite);
        fs.writeFileSync(`${root}/.gitignore`, `${item} \n`, {
            flag: "a",
            encoding: "utf-8",
            mode: "0666",
        });
    });
}

function getInputAnswer() {
    return new Promise((resolve, reject) => {
        rl.on("line", (input) => {
            resolve(input);
        });
    });
}

function getBranch(root) {
    console.log("Get the Framework version.");
    let path = `${root}/init.json`;
    const fileExists = fs.existsSync(path);
    if (!fileExists) {
        console.error("init.json is must");
        console.log("Init Failed!");
        process.exit(0);
    } else {
        const config = getFileContent(path);
        let branch = "master";
        if (isEmptyString(config["version"])) {
            console.error("version is must");
            console.log("Init Failed!");
            process.exit(0);
        }
        if (!isEmptyString(config["version"])) {
            branch = `${config["version"]}`;
        }
        console.log(`The system dependency Framework version is ${branch}.`);
        return branch;
    }
}

function getFrameworkFromGit(root, branch) {
    console.log(`Getting the framework from Git (${branch})`);
    const cmd = `git archive ${branch} --format=zip --prefix=tmp-init/ -o ${root}/tmp-init.zip --remote=git@git.lcbint.cn:angular/h5-framework-ng.git`;
    return new Promise((resolve, reject) => {
        execAsync(cmd, (error, stdout, stderr) => {
            if (error) {
                failInitExit(error);
                return;
            }
            resolve("clone success");
        });
    });
}

function installAdmZip() {
    const cmd = `cnpm install adm-zip@0.4.7`;
    return new Promise((resolve, reject) => {
        execAsync(cmd, (error, stdout, stderr) => {
            if (error) {
                failInitExit(error);
                return;
            }
            resolve("clone success");
        });
    });
}

function installPackage() {
    const cmd = `npm i`;
    return new Promise((resolve, reject) => {
        execAsync(cmd, (error, stdout, stderr) => {
            if (error) {
                failInitExit(error);
                return;
            }
            resolve("clone success");
        });
    });
}

function unzip(source, target) {
    // return new Promise((resolve, reject) => {
    //     fs.createReadStream(`${root}/tmp-init.zip`).pipe(myUnzip.Extract({path: `${root}/`}));
    //     resolve('unzip success');
    // })
    const zip = new admzip(source);
    zip.extractAllTo(target);
}

function getFileContent(path) {
    try {
        let contentString = fs.readFileSync(path, "utf8");
        let contentObj = JSON.parse(contentString);
        return contentObj;
    } catch (e) {
        // 如果内容不是json字符串
        failInitExit("file error");
    }
}

function copyFolderSync(source, target) {
    let files = [];

    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    if (fs.existsSync(source) && fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach((file) => {
            const curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder, true);
            }
        });
    }
}

function copyFileSync(source, target, flag = false) {
    let targetFile = target;

    if (!fs.existsSync(source)) {
        console.log(`(${source} do not exist)`);
        return true;
    }
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    if (!fs.existsSync(targetFile)) {
        fs.writeFileSync(targetFile, fs.readFileSync(source));
        if (params["output"] && params["output"] === "true")
            console.log(`${targetFile} create  completion.`);
        return true;
    }
    if (flag === true) {
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    } else {
        if (params["output"] && params["output"] === "true")
            console.log(`skip ${targetFile} (${targetFile} has already exist)`);
    }
}

async function makeIndex(envName) {
    // let filePath;
    if (envName === "local") {
        return true;
    }
    // filePath = `${root}/environments/environment.${envName}.ts`;
    const appId = getConfigMsg(`${root}/environments/main.ts`, "appId");
    // const host = getConfigMsg(filePath, 'HOST');
    const indexFileContent = fs.readFileSync(
        `${root}/${frameworkName}/index.html`,
        "utf8"
    );
    const tmpIndexFileContent = indexFileContent.replace(
        '<base href="/">',
        `<base href="/${appId}/">`
    );
    try {
        const writeSuccess = await writeFile(
            `${root}/${frameworkName}/index.html`,
            tmpIndexFileContent
        );
        console.log(`${envName} environment:`, writeSuccess);
    } catch (err) {
        failInitExit(err);
    }
}

function getConfigMsg(pathFile, key) {
    let appIdStr;
    const mainContent = fs.readFileSync(pathFile, "utf8");
    const mainArr = mainContent.split("=");
    if (!mainArr[1]) {
        failInitExit("Configuration missing");
    }
    const tmpAppIdStr = mainArr[1].trim().split(",");
    if (tmpAppIdStr instanceof Array === true) {
        tmpAppIdStr.forEach((item) => {
            let tmpItem = item.trim();
            if (tmpItem.indexOf(key) >= 0) {
                appIdStr = tmpItem;
                return false;
            }
        });
    }
    if (!appIdStr) {
        failInitExit("Configuration missing");
    }

    if (appIdStr.match(/\'(.*)\'/)) {
        return appIdStr.match(/\'(.*)\'/)[1].trim();
    } else if (appIdStr.match(/\"(.*)\"/)) {
        return appIdStr.match(/\"(.*)\"/)[1].trim();
    } else {
        failInitExit("Configuration missing");
    }
}

function writeFile(file, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, "utf8", (err) => {
            if (err) throw err;
            resolve("index.html update success!");
        });
    });
}

function deleteFolder(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolder(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function failInitExit(str = null) {
    try {
        fs.unlinkSync(`${root}/tmp-init.zip`);
        deleteFolder(`${root}/tmp-init`);
    } catch (e) {
        console.log(e);
    }
    console.error(str);
    console.log("Init Failed!");
    process.exit(0);
}

function getParams() {
    const args = {};
    const arguments = process.argv.splice(2);

    if (!arguments.length) {
        return false;
    }

    arguments.forEach((arg) => {
        const tmpArg = arg.trim().split("=");
        if (tmpArg.length) {
            args[tmpArg[0].replace(/\W+/g, "")] = tmpArg[1];
        } else {
            return false;
        }
    });
    return args;
}

//是否为范围内正整数
function isPositiveInteger(num, len) {
    const reg = new RegExp("^\\d+$");
    return reg.test(num) && num - len <= 0;
}

//检查是否空字符串
function isEmptyString(string) {
    return !(typeof string === "string" && string.trim() !== "");
}

// 判断元素是否在数组内
function contains(arr, obj) {
    let i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
}
