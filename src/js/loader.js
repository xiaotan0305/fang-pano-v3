/* Copyright 2016年 - 2017年 上海亦我信息技术有限公司. All rights reserved. */

/**
 * 判断是否支持webGL
 * @returns
 */
var isWebGLSupport = function () {
    try {
        var canvas = document.createElement('canvas');
        return !(!window.WebGLRenderingContext || !canvas.getContext('webgl') && !canvas.getContext('experimental-webgl'));
    } catch (err) {
        return false;
    }
};

/**
 * 获取浏览器信息
 * @returns
 */
var getBrowser = function () {
    var e,
        userAgent = navigator.userAgent,
        n = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    return /trident/i.test(n[1]) ? (e = /\brv[ :]+(\d+)/g.exec(userAgent) || [], { name: "IE", version: e[1] || "" }) : "Chrome" === n[1] && null !== (e = userAgent.match(/\bOPR|Edge\/(\d+)/)) ? {
        name: "Opera",
        version: e[1]
    } : (n = n[2] ? [n[1], n[2]] : [navigator.appName, navigator.appVersion, "-?"], null !== (e = userAgent.match(/version\/(\d+)/i)) && n.splice(1, 1, e[1]), { name: n[0], version: n[1] });
};

/**
 * 加载script标签
 * @param url
 */
var loadJavaScript = function (url) {
    var script = document.createElement('script');
    script.src = url;
    script.async = false;
    if (navigator.userAgent.indexOf('MSIE') > 0) {
        script.onreadystatechange = function () {
            if (this.readyState === 'loaded' || this.readyState === 'complete') {
                callback();
                this.onload = this.onreadystatechange = null;
                this.parentNode.removeChild(this);
            }
        };
    } else {
        script.onload = function () {
            // this.onload = this.onreadystatechange = null;
            // this.parentNode.removeChild(this);
        };
    }
    document.getElementsByTagName('head')[0].appendChild(script);
};

/**
 * 加载script标签
 * @param urlArr
 */
var loadJavaScripts = function (urlArr) {
    // var loadedFn = function () {
    //     if (++n === urlArr.length) {
    //         callback && callback();
    //     } else {
    //         loadJavaScript(urlArr[n], loadedFn);
    //     }
    // };
    for (let i = 0; i < urlArr.length; i++) {
        loadJavaScript(urlArr[i]);
    }
};

/**
 * 页面加载后初始化
 */
window.onload = function () {
    if (isWebGLSupport()) {
        var arr = [
            'lib/jquery/jquery_2.1.1.min.js',
            'lib/threejs/three.js',
            'lib/threejs/OrbitControls.js',
            'lib/threejs/stats.min.js',
            'lib/vr/PhoneVR.js',
            'lib/vr/VRControls.js',
            'lib/vr/VREffect.js',
            'lib/bootstrap/bootstrap.min.js',
            'dist/pano.min.js'
        ];
        loadJavaScripts(arr);
    } else {
        document.getElementById('loading_bar').style.visibility = 'hidden';
        var browserInfo = getBrowser();
        document.getElementById('loading_tip').innerHTML = '您的浏览器不支持VR看房，当前浏览器版本是：' + browserInfo.name + ' ' + browserInfo.version + '<br/><br/>请使用以下浏览器：<br/>IE11、IE Edge、Firefox48+、Chrome50+、Safari9+、猎豹浏览器、360浏览器、UC浏览器<br/>';
    }
};