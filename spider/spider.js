// 依赖模块
const fs = require('fs');
const request = require("request");
const mkdirp = require('mkdirp');
let jsonName = './data.json';

// 获取参数
let ops = process.argv.splice(2);
if (ops.length) {
    jsonName = '';
    let name = ops[0];
    if (name.substring(0,2) !== './') {
        jsonName = './' + name;
    }
    if (!/\.json/.test(name)) {
        jsonName += '.json';
    }
}

const existFile = fs.existsSync(jsonName);
if (!existFile) {
    return console.error(`${jsonName} 不存在,退出进程....`);
}
const viewData = require(jsonName);

// 递归查找图片
let recurseData = function (arr, data, type) {
    for (const key in data) {
        if (data.hasOwnProperty(key) === true) {
            if (key === 'ImagePath') {
                switch (type) {
                    case 'hot':
                        let imagePath = data[key];
                        arr.push(imagePath);
                        let rootPath = imagePath.substring(0, imagePath.lastIndexOf("/") + 1).replace("PanoramaImages", "PanoramaTileImages");
                        let imageName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
                        imageName = imageName.substring(0, imageName.lastIndexOf("."));
                        // console.log(rootPath + imageName + "_l.jpg");
                        arr.push(rootPath + imageName + "_l.jpg",
                            rootPath + imageName + "_r.jpg",
                            rootPath + imageName + "_u.jpg",
                            rootPath + imageName + "_d.jpg",
                            rootPath + imageName + "_f.jpg",
                            rootPath + imageName + "_b.jpg");
                        break;
                    default:
                        arr.push(data[key]);
                        break;
                }
            } else if (data[key] instanceof Array || data[key] instanceof Object) {
                recurseData(arr, data[key], type);
            }
        }
    }
};
// 创建目录
let mkDir = function (dir) {
    mkdirp('./' + dir, function (err) {
        if (err) {
            console.log('文件夹创建失败:', err);
        }
    });
};
// 清空目录
let dlDir = function (path,arr,initDir) {
    let files = [];
    arr.push(path);
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file) {
            var curPath = path + '/' + file;
            if (fs.statSync(curPath).isDirectory()) {
                dlDir(curPath,arr);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
        arr.splice(arr.indexOf(path),1);
        if (arr.length) {
            console.log(`目录${initDir} 清空完成`);
        }
    }
};
// 下载图片
let download = function (url, dir, filename, arr) {
    request.head(url, function (err, res, body) {
        request(url).pipe(fs.createWriteStream(dir + "/" + filename));
        checkDone(arr);
    });
};
// 检查下载完成
let checkDone = function (arr) {
    arr.index = arr.index || 0;
    arr.index++;
    if (arr.index === arr.length) {
        console.log('下载完成');
    }
};

// 发送请求
let downImg = function (arr,dir) {
    arr.count = arr.count || 0;
    arr.count = 0;
    arr.forEach(ele => {
        const filePathArr = ele.split('/');
        const slashLen = filePathArr.length;
        const fileName = filePathArr[slashLen - 1];
        const fileFolder = filePathArr[slashLen - 2];
        arr.count++;
        mkdirp(dir + '/' + fileFolder);
        const url = encodeURIComponent(ele).replace('%3A%2F%2F', '://').replace(/%2F/g, '/');
        setTimeout(() => {
            console.log('开始下载:', ele);
            download(url, `${dir}/${fileFolder}`, fileName, arr);
        }, 50 * arr.count);
    });
};
let dir = './images/' + jsonName.replace('.json','').replace('./','');
dlDir(dir,[],dir);
// 3D
let imgRoomsArr = [];
let imgRoomsJson = viewData.Rooms;
// 大图
let imgHotSpotsArr = [];
let imgHotSpotsJson = viewData.HotSpots;

// 3D 和大图
recurseData(imgRoomsArr, imgRoomsJson, 'room');
recurseData(imgHotSpotsArr, imgHotSpotsJson, 'hot');
console.log(`从json中取到Rooms数据:${imgRoomsArr.length}条`);
console.log(`从json中取到HotSpots数据:${imgHotSpotsArr.length}条`);
// 3D和大图
downImg(imgRoomsArr,dir);
downImg(imgHotSpotsArr,dir);