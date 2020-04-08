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
                @mouseleave="canvasLeave()"
                @touchstart="touchDown($event)"
                @touchmove="touchMove($event)"
                @touchend="canvasLeave()"
                ref="canvas"
                style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)"
        >你的浏览器不支持canvas</canvas>
        <br>
        <i class="el-icon-time"></i>
        <el-select v-model="canvasTime" placeholder="识别速度" style="width: 80px">
            <el-option label="即时" :value="0"/>
            <el-option label="快" :value="500"/>
            <el-option label="中" :value="1000"/>
            <el-option label="慢" :value="2000"/>
            <el-option label="无" :value="-1"/>
        </el-select>
        <el-button v-show="canvasTime===-1" @click="recognize" icon="el-icon-position" />
        <el-button @click="download" icon="el-icon-camera" />
        <el-button @click="addMode = !addMode">{{addMode ? '✕' : '+'}}</el-button>
        <el-input v-show="addMode" placeholder="选择或输入scheme" v-model="addAppScheme" class="input-with-select" style="width: 210px;">
            <el-select v-model="addAppScheme" slot="prepend">
                <el-option v-for="(v, k) in appOptions" :key="k" :label="k" :value="v">
                    <span style="float: left;margin-right: 10px">{{ k }}</span>
                    <span style="float: right; color: #8492a6;">{{ v }}</span>
                </el-option>
            </el-select>
        </el-input>
        <el-button @click="handleManageScheme" icon="el-icon-setting" />
        <el-dialog title="管理Scheme" :visible.sync="manageScheme">
            <el-table :data="schemeList" style="width: 100%">
                <el-table-column>
                    <template slot-scope="{row}">
                        {{ row }}
                    </template>
                </el-table-column>
                <el-table-column>
                    <template slot-scope="{row, $index}">
                        <el-button type="danger" icon="el-icon-delete" circle plain @click="handleDeleteScheme(row, $index)"/>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
        <p>请在画布中作画，系统识别后将自动跳转。</p>
    </div>
</template>

<script>
import {getHash, getScheme} from '../utils/compare'
import {handleJump} from "../utils/jump.js";

export default {
    name: "Draw",
    data() {
        return {
            width: Math.min(document.documentElement.clientWidth * 0.9, document.documentElement.clientHeight * 0.6),
            height: Math.min(document.documentElement.clientWidth * 0.9, document.documentElement.clientHeight * 0.6),
            canvasTime: 1000,
            hashSchemeMap: JSON.parse(localStorage.getItem('hashSchemeMap')) || {},
            appOptions: {
                '篮球': 'https://tiyu.baidu.com/match/NBA/from/baidu_aladdin',
                '足球': 'https://tiyu.baidu.com/match/欧冠/from/baidu_aladdin',
                '网球': 'http://sports.cctv.com/tennis/',
                '乒乓': 'http://sports.sina.com.cn/others/pingpang.shtml'
            },
            schemeList: [],
            manageScheme: false,
            addMode: false,
            addAppScheme: null
        }
    },
    created() {
        console.log(this.hashSchemeMap);
    },
    mounted() {
        this.show();
        window.onresize = function windowResize () {
            this.width = Math.min(document.documentElement.clientWidth * 0.9, document.documentElement.clientHeight * 0.6);
            this.height = Math.min(document.documentElement.clientWidth * 0.9, document.documentElement.clientHeight * 0.6);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    },
    methods:{
        show(){
            this.canvas = this.$refs.canvas;//指定canvas
            this.ctx = this.canvas.getContext("2d");//设置2D渲染区域
            this.ctx.lineWidth = 3;//设置线的宽度
            this.ctx.rect(0, 0, this.width, this.height);
            this.ctx.fillStyle="white";
            this.ctx.fill();
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
            if (!this.canvasMoveUse) {
                return;
            }
            this.canvasMoveUse = false;
            this.startTime = Date.now();
            setTimeout(() =>{
                const endTime = Date.now();
                if (this.canvasTime !== -1 && endTime - this.startTime >= this.canvasTime) {
                    this.recognize();
                }
            },this.canvasTime);
        },
        recognize() {
            const hash = getHash(this.canvas, this.ctx);
            if (this.addMode) {
                this.hashSchemeMap[this.addAppScheme] = hash;
                localStorage.setItem('hashSchemeMap', JSON.stringify(this.hashSchemeMap));
                this.$message.success({message: "添加成功：" + this.addAppScheme, duration: 1000});
                this.addMode = false;
                this.addAppScheme = null;
            } else {
                let url = getScheme(this.hashSchemeMap, hash);
                if (url) {
                    window.location.href = url;
                }
            }
            this.clear();
        },
        clear(){
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.show();
        },
        handleManageScheme() {
            this.schemeList = [];
            for (const k in this.hashSchemeMap) {
                this.schemeList.push(k);
            }
            this.manageScheme = true;
        },
        handleDeleteScheme(scheme, index) {
            delete this.hashSchemeMap[scheme];
            localStorage.setItem('hashSchemeMap', JSON.stringify(this.hashSchemeMap));
            this.schemeList.splice(index, 1);
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
            aElement.remove();
        }
    }
}
</script>

<style scoped>

</style>