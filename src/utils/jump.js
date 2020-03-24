export function handleJump(that, url, param = {}) {
    schemeTimesRecord(url);
    schemeJump(that, url, param);
}
// record scheme jump times
export function schemeTimesRecord(url) {
    let schemeJumpTimes = localStorage.getItem("schemeJumpTimes");
    schemeJumpTimes = schemeJumpTimes ? JSON.parse(schemeJumpTimes) : {};
    schemeJumpTimes[url] = schemeJumpTimes[url] + 1;
    localStorage.setItem("schemeJumpTimes", JSON.stringify(schemeJumpTimes));
}
// 处理跳转事件
export function schemeJump(that = this, url, param = {}) {
    const ua = navigator.userAgent.toLowerCase(); // 获取并测试浏览器UA
    const isMobile = /mobile/gi.test(ua);

    // 非移动端，提示错误信息
    if (!isMobile) {
        that.$message.warning({
            message: "仅在移动端有效（" + url + "）",
            duration: 1000
        });
        return;
    }

    // 若在微信中浏览该页面，无法正常跳转
    const isWeixin = ua.indexOf("micromessenger") !== -1;
    if (isWeixin) {
        that.$message.warning({
            message: "微信中可能不能正常跳转",
            duration: 1000
        });
    }

    // url拼接参数
    let isFirst = true;
    if (param) {
        for (let k in param) {
            if (isFirst) {
                url += "?";
                isFirst = false;
            } else {
                url += "&";
            }
            url += k + "=" + param[k];
        }
    }

    // 安卓端跳转
    let iFrame;
    const u = navigator.userAgent;
    const isAndroid =
        u.indexOf("Android") > -1 || u.indexOf("Adr") > -1; //android终端
    const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    if (isAndroid) {
        //安卓终端使用iframe
        iFrame = document.createElement("iframe");
        iFrame.setAttribute("src", url);
        iFrame.setAttribute("style", "display:none;");
        iFrame.setAttribute("height", "0px");
        iFrame.setAttribute("width", "0px");
        iFrame.setAttribute("frameborder", "0");
        document.body.appendChild(iFrame);
        // 发起请求后这个 iFrame 就没用了，所以把它从 dom 上移除掉
        iFrame.parentNode.removeChild(iFrame);
        iFrame = null;
    } else if (isiOS) {
        window.location.href = url;
        setTimeout(() => {
            that.$message.warning({
                message: "取消跳转后可能需要刷新",
                duration: 1000
            });
        }, 2000);
    } else {
        window.location.href = url;
    }
}