<template>
    <div>
        <canvas
                @touchmove.prevent
                id="canvas"
                :width="width"
                :height="height"
                @mousedown="canvasDown($event)"
                @mousemove="canvasMove($event)"
                @mouseup="canvasLeave()"
                @touchstart="touchDown($event)"
                @touchmove="touchMove($event)"
                @touchend="canvasLeave()"
                ref="canvas"
                style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)"
        >你的浏览器不支持canvas</canvas>
        <br>
        <el-button @click="download">
            保存
        </el-button>
    </div>
</template>

<script>
export default {
    name: "Draw",
    data() {
        return {
            width: document.documentElement.clientWidth * 0.9,
            height: document.documentElement.clientHeight * 0.6
        }
    },
    mounted() {
        this.show();
        window.onresize = function windowResize () {
            this.width = document.documentElement.clientWidth * 0.9;
            this.height = document.documentElement.clientHeight * 0.6;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    },
    methods:{
        show(){
            this.canvas = this.$refs.canvas;//指定canvas
            this.ctx = this.canvas.getContext("2d");//设置2D渲染区域
            this.ctx.lineWidth = 3;//设置线的宽度
        },
        canvasDown(e) {
            this.canvasMoveUse = true;
            this.startTime = Date.now();
            const canvasX = e.clientX - e.target.offsetLeft;
            const canvasY = e.clientY - e.target.offsetTop + document.documentElement.scrollTop;
            this.ctx.beginPath();  // 移动的起点
            this.ctx.moveTo(canvasX, canvasY);
        },
        canvasMove(e) {
            if (this.canvasMoveUse) {
                let canvasX;
                let canvasY;
                canvasX = e.clientX - e.target.offsetLeft;
                canvasY = e.clientY - e.target.offsetTop + document.documentElement.scrollTop;
                this.ctx.lineTo(canvasX, canvasY);
                this.ctx.stroke();
            }
        },
        touchDown(e) {
            this.canvasMoveUse = true;
            this.startTime = Date.now();
            const canvasX = e.changedTouches[0].clientX - e.target.offsetLeft;
            const canvasY = e.changedTouches[0].clientY - e.target.offsetTop + document.documentElement.scrollTop;
            this.ctx.beginPath();  // 移动的起点
            this.ctx.moveTo(canvasX, canvasY);
        },
        touchMove(e) {
            if (this.canvasMoveUse) {
                let canvasX;
                let canvasY;
                canvasX = e.changedTouches[0].clientX - e.target.offsetLeft;
                canvasY = e.changedTouches[0].clientY - e.target.offsetTop + document.documentElement.scrollTop;
                this.ctx.lineTo(canvasX, canvasY);
                this.ctx.stroke();
            }
        },
        canvasLeave() {
            this.canvasMoveUse = false;
            this.startTime = Date.now();
            setTimeout(() =>{
                const endTime = Date.now();
                if (endTime - this.startTime > 1000) {
                    this.handleJump();
                    this.clear();
                }
            },1100);
        },
        clear(){
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        },
        convertCanvasToImage() {
            const MIME_TYPE = 'image/png';
            return this.canvas.toDataURL(MIME_TYPE);
        },
        download() {
            const imgURL = this.convertCanvasToImage();
            const aElement = document.createElement('a');
            aElement.download = 'pic';
            aElement.href = imgURL;
            aElement.click();
        },
        handleJump() {
            let params = {};
            let url = "weixin://";
            this.shareJump(url, params);
        },
        // 分享跳转
        shareJump(url, param) {
            const ua = navigator.userAgent.toLowerCase();
            const isMobile = /mobile/gi.test(ua);
            if (!isMobile) {
                this.$message.warning({message: "仅在移动端有效", duration: 1000});
                return;
            }
            const isWeixin = ua.indexOf('micromessenger') !== -1;
            if (isWeixin) {
                this.$message.warning({message: "微信中可能不能正常跳转", duration: 1000});
            }
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
            const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
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
                setTimeout(() =>{
                    this.$message.warning({message: "取消跳转后请刷新页面", duration: 1000})
                }, 2000);
            } else {
                window.location.href = url;
            }
        }
    }
}
</script>

<style scoped>

</style>