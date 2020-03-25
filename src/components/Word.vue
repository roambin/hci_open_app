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
			:height="height"
			:width="width"
			style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);"
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
		<p>当前搜索内容：{{this.recognizeText}}</p>
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
		<el-button @click="show">清空当前画布</el-button>
		<!-- 清空当前结果 -->
		<el-button
			@click="clearRecognize"
			v-loading.fullscreen.lock="isLoadModel"
			element-loading-text="拼命加载中"
		>重置搜索内容</el-button>
		<!-- 管理手势。不需要 -->
		<!-- <el-button @click="handleManageScheme" icon="el-icon-setting" /> -->
		<h3>手写识别</h3>
		<p>请在画布中书写字母、数字或汉字，系统将识别您写的文字，并在一旁显示。</p>
	</div>
</template>

<script>
/* eslint-disable*/
import { getSchemeByML } from "../utils/compare";
// import * as mlModel from "../utils/script.js";
// import * as tf from "@tensorflow/tfjs";
import * as ml5 from "../utils/ml5.min.js";

export default {
	name: "Word",
	data() {
		return {
			width: Math.min(
				document.documentElement.clientWidth * 0.9,
				document.documentElement.clientHeight * 0.6
			),
			height: Math.min(
				document.documentElement.clientWidth * 0.9,
				document.documentElement.clientHeight * 0.6
			),
			isLoadModel: true,
			canvas: null,
			ctx: null,
			canvasMoveUse: false, // 是否触发按下鼠标/屏幕事件
			startTime: null, // 按下鼠标/屏幕的开始时间
			canvasTime: 1000,
			model: "",
			recognizeText: "",
			classifier: {}
		};
	},
	created() {
		this.loadModel();
	},
	mounted() {
		this.init();
		this.show();
		this.onresize = function() {};
	},
	methods: {
		init() {
			this.canvas = this.$refs["canvas"];
			this.ctx = this.canvas.getContext("2d");
		},
		show() {
			// 设置样式
			this.ctx.lineWidth = 3;
			this.ctx.fillStyle = "white";
			this.ctx.strokeStyle = "#000";
			// 绘制画布
			this.ctx.beginPath();
			this.ctx.rect(0, 0, this.width, this.height);
			this.ctx.closePath();
			this.ctx.fill();
		},
		canvasDown(e) {
			let canvasX = e.clientX - e.target.offsetLeft,
				canvasY =
					e.clientY -
					e.target.offsetTop +
					document.documentElement.scrollTop;
			this.canvasMoveUse = true;
			this.startTime = Date.now();
			this.ctx.beginPath();
			this.ctx.moveTo(canvasX, canvasY);
		},
		canvasMove(e) {
			if (this.canvasMoveUse) {
				let canvasX = e.clientX - e.target.offsetLeft,
					canvasY =
						e.clientY -
						e.target.offsetTop +
						document.documentElement.scrollTop;
				this.ctx.lineTo(canvasX, canvasY);
				this.ctx.stroke();
			}
		},
		canvasLeave() {
			if (!this.canvasMoveUse) {
				return;
			}
			this.canvasMoveUse = false;
			this.startTime = Date.now();
			setTimeout(() => {
				const endTime = Date.now();
				if (
					this.canvasTime !== -1 &&
					endTime - this.startTime >= this.canvasTime
				) {
					this.recognize();
				}
			}, this.canvasTime);
		},
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
				this.ctx.lineTo(canvasX, canvasY);
				this.ctx.stroke();
			}
		},
		// 这里是识别算法。
		recognize() {
			let img = this.ctx.getImageData(
				0,
				0,
				this.canvas.width,
				this.canvas.height
			);
			this.classifier.classify(img, (err, results) => {
				this.recognizeText += this.getMostLikelyCharacter(results);
			});
			this.show();
		},
		getMostLikelyCharacter(results) {
			let label = "",
				labelConfidence = 0;

			results.map((item, index) => {
				if (item.confidence > labelConfidence) {
					label = item.label;
					labelConfidence = item.labelConfidence;
				}
			});
			return label;
		},
		// 清空识别的内容
		clearRecognize() {
			this.recognizeText = "";
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
		async loadModel() {
			this.isLoadModel = true;
			const classifier = ml5.imageClassifier(
				window.location.href + "ocr/model.json",
				() => {
					this.isLoadModel = false;
				}
			);
			this.classifier = classifier;
		}
	}
};
</script>

<style scoped>
</style>