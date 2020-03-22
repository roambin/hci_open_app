<template>
	<div>
		<!-- mousedown:指针设备按下鼠标时触发 -->
		<!-- mousemove:指针设备在元素上移动时触发 -->
		<!-- mouseup:指针设备按钮抬起时触发 -->
		<!-- mouseleave:指针设备移出某个元素时触发 -->
		<!-- touchstart:触点与触控设备表面接触时触发 -->
		<!-- touchmove:触点在触控平面上移动时触发 -->
		<!-- touchend:触点离开触控平面时触发 -->
		<canvas
			id="canvas"
			ref="canvas"
            height="28px"
            width="28px"
			style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);background-color:black;"
			@touchmove.prevent
			@mousedown="canvasDown($event)"
			@mousemove="canvasMove($event)"
			@mouseup="canvasLeave()"
			@mouseleave="canvasLeave()"
			@touchstart="touchDown($event)"
			@touchmove="touchMove($event)"
			@touchend="canvasLeave()"
		>你的浏览器不支持canvas</canvas>
		<br />
		<i class="el-icon-time"></i>
		<!-- 切换识别速度 -->
		<el-select v-model="canvasTime" placeholder="识别速度" style="width: 80px">
			<el-option label="即时" :value="0" />
			<el-option label="快" :value="500" />
			<el-option label="中" :value="1000" />
			<el-option label="慢" :value="2000" />
			<el-option label="无" :value="-1" />
		</el-select>
		<!-- 当识别速度为无时，通过手动点击获取手势 -->
		<el-button v-show="canvasTime===-1" @click="recognize" icon="el-icon-position" />
		<!-- 下载当前手势 -->
		<el-button @click="download" icon="el-icon-camera" />
        <!-- 清空画布 -->
        <el-button @click="clear">清空当前画布</el-button>
		<!-- 添加手势。不需要 -->
		<el-button @click="trainModel">训练模型</el-button>
		<!-- 管理手势。不需要 -->
		<!-- <el-button @click="handleManageScheme" icon="el-icon-setting" /> -->
		<h3>手写识别</h3>
		<p>请在画布中书写字母、数字或汉字，系统将识别您写的文字，并在一旁显示。</p>
	</div>
</template>

<script>
import { getSchemeByML } from "../utils/compare";
import * as mlModel from "../utils/script.js";
import * as tf from '@tensorflow/tfjs';

export default {
	name: "Word",
	data() {
		return {
			// width: Math.min(
			// 	document.documentElement.clientWidth * 0.9,
			// 	document.documentElement.clientHeight * 0.6
			// ),
			// height: Math.min(
			// 	document.documentElement.clientWidth * 0.9,
			// 	document.documentElement.clientHeight * 0.6
			// ),
			width: 28,
			height: 28,
			canvas: null,
			ctx: null,
			canvasMoveUse: false, // 是否触发按下鼠标/屏幕事件
			startTime: null, // 按下鼠标/屏幕的开始时间
			canvasTime: 1000,
			model: ""
		};
	},
	created() {},
	mounted() {
		this.show();
		this.onresize = function() {
			this.width = 28;
			this.height = 28;
			this.canvas.width = this.width;
            this.canvas.height = this.height;
		};
	},
	methods: {
		// 显示幕布
		show() {
			this.canvas = this.$refs["canvas"];
            this.ctx = this.canvas.getContext("2d");    // 返回一个CanvasRenderingContext2D的canvas上下文
            this.ctx.lineWidth = 1;                     // 设置线的宽度
			this.ctx.rect(0, 0,28, 28);                 // 创建一个矩形路径，设置矩形的起点位置。起点位置为(x,y)，尺寸为this.width，this.height
			this.ctx.fillStyle = "black";               // 图形内部的颜色和样式。被设置为白色。
            this.ctx.fill();                            // 根据当前的填充样式，填充当前或已存在的路径的方法。
            this.ctx.strokeStyle = "#fff";              // 设置画笔颜色为白色
		},
		// 指针设备按下鼠标时触发
		canvasDown(e) {
			let canvasX = e.clientX - e.target.offsetLeft,
				canvasY =
					e.clientY -
					e.target.offsetTop +
					document.documentElement.scrollTop;
			this.canvasMoveUse = true;          // 设置move Flag
			this.startTime = Date.now();        // 返回的是当前事件的时间戳
			this.ctx.beginPath();               // 清空子路径列表，开始新路径
			this.ctx.moveTo(canvasX, canvasY);  // 将一个新的子路径的起始点移动到(x，y)坐标的方法。
		},
		// 指针设备在元素上移动时触发
		canvasMove(e) {
			if (this.canvasMoveUse) {
				let canvasX = e.clientX - e.target.offsetLeft,
					canvasY =
						e.clientY -
						e.target.offsetTop +
						document.documentElement.scrollTop;
				this.ctx.lineTo(canvasX, canvasY);  // 使用直线连接子路径的终点到x，y坐标的方法。（并不会真正地绘制）。
				this.ctx.stroke();                  // 根据当前的画线样式，绘制当前或已经存在的路径的方法。
			}
		},
		// 指针设备按钮抬起时触发、指针设备移出某个元素时触发、触点离开触控平面时触发
		canvasLeave() {
			if (!this.canvasMoveUse) {
				// 如果当前仍未按下鼠标，不执行后面的事件
				return;
			}
			this.canvasMoveUse = false; // 设置move Flag为false
			this.startTime = Date.now(); // 获取开始时间
			setTimeout(() => {
				// 延迟设置的canvasTime时间后，触发回调函数
				const endTime = Date.now(); // 获取结束时间
				if (
					this.canvasTime !== -1 &&
					endTime - this.startTime >= this.canvasTime
				) {
					// 开始时间-结束时间相较于延迟时间（canvasTime更大），则生效
					this.recognize(); // 调用识别算法
				}
			}, this.canvasTime);
		},
		// 手机端：触点与触控设备表面接触时触发。逻辑完全与canvasDown类似，只是获取内容的方式不一致。
		touchDown(e) {
			let canvasX = e.changedTouches[0].clientX - e.target.offsetLeft,
				canvasY =
					e.changedTouches[0].clientY -
					e.target.offsetTop +
					document.documentElement.scrollTop;
			this.canvasMoveUse = true;
			this.startTime = Date.now();
			this.ctx.beginPath(); // 移动的起点
			this.ctx.moveTo(canvasX, canvasY);
		},
		touchMove(e) {
			if (this.canvasMoveUse) {
				let canvasX = e.changedTouches[0].clientX - e.target.offsetLeft,
					canvasY =
						e.changedTouches[0].clientY -
						e.target.offsetTop +
						document.documentElement.scrollTop;
				this.ctx.lineTo(canvasX, canvasY); // 使用直线连接子路径的终点到x，y坐标的方法。（并不会真正地绘制）。
				this.ctx.stroke();
			}
		},
		// 这里是识别算法。需要修改!!!
		recognize() {
			// const hash = getHash(this.canvas, this.ctx); // 获取当前图像在ahash算法中的hash值？
			// if (this.addMode) { // 新增模式
			//     this.hashSchemeMap[this.addAppScheme] = hash; // 添加hash至hashSchemeMap
			//     localStorage.setItem('hashSchemeMap', JSON.stringify(this.hashSchemeMap)); // 更新localStorage中的hash
			//     this.$message.success({message: "添加成功：" + this.addAppScheme, duration: 1000});
			//     this.addMode = false; // 取消新增模式
			//     this.addAppScheme = null; // 重制新增App的scheme
			// } else {
			//     let url = getSchemeByML(this.hashSchemeMap, hash); // 获取模式 该方法需要修改
			//     console.log('scheme: ' + url);
			//     if (url) {
			//         this.handleJump(url);
			//     }
			// }
			// 将canvas的数据转换为输入。
			var imageArray = new Float32Array(1 * this.width * this.height),
				imgData = this.ctx.getImageData(
					0,
					0,
					this.canvas.width,
					this.canvas.height
				).data,
                xs = null,
                imageOnlyRed = [];

            var t = this;
            for(let i=0;i<imgData.length/4;i++){
                imageOnlyRed.push(imgData[i*4]/255);
            }

			imageArray.set(imageOnlyRed);
			xs = tf.tensor2d(imageArray, [1, this.width * this.height]);

			mlModel.doPrediction(this.model, xs, 1);

			this.clear();
		},
		// 清除当前画布
		clear() {
			this.ctx.clearRect(
				0,
				0,
				this.ctx.canvas.width,
				this.ctx.canvas.height
			);
			// this.show();
		},
		// 处理跳转事件 这个应该不用重写
		handleJump(url, param = {}) {
			const ua = navigator.userAgent.toLowerCase(); // 获取并测试浏览器UA
			const isMobile = /mobile/gi.test(ua);

			// 非移动端，提示错误信息
			if (!isMobile) {
				this.$message.warning({
					message: "仅在移动端有效",
					duration: 1000
				});
				return;
			}

			// 若在微信中浏览该页面，无法正常跳转
			const isWeixin = ua.indexOf("micromessenger") !== -1;
			if (isWeixin) {
				this.$message.warning({
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
					this.$message.warning({
						message: "取消跳转后可能需要刷新",
						duration: 1000
					});
				}, 2000);
			} else {
				window.location.href = url;
			}
		},
		// 下载当前画布中的内容
		download() {
			const imgURL = this.convertCanvasToImage();
			const aElement = document.createElement("a");
			aElement.download = "pic";
			aElement.href = imgURL;
			aElement.click();
			aElement.remove();
		},
		// 转换canvas为图片
		convertCanvasToImage() {
			const MIME_TYPE = "image/png";
			return this.canvas.toDataURL(MIME_TYPE);
		},
		// 训练模型
		async trainModel() {
			this.model = await mlModel.run();
		}
	}
};
</script>

<style scoped>
</style>