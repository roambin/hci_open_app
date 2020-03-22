<template>
  <div>
    <el-row>
      <el-col :span="4" :style="'color: ' + (pickIndex === 7 ? '#5daf34' : '')">{{ getItems(7) }}</el-col>
      <el-col :span="16" :style="'color: ' + (pickIndex === 0 ? '#5daf34' : '')">{{ getItems(0) }}</el-col>
      <el-col :span="4" :style="'color: ' + (pickIndex === 1 ? '#5daf34' : '')">{{ getItems(1) }}</el-col>
    </el-row>
    <el-row type="flex" align="middle">
      <el-col :span="4" :style="'color: ' + (pickIndex === 6 ? '#5daf34' : '')">{{ getItems(6) }}</el-col>
      <el-col :span="16">
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
      </el-col>
      <el-col :span="4" :style="'color: ' + (pickIndex === 2 ? '#5daf34' : '')">{{ getItems(2) }}</el-col>
    </el-row>
    <el-row>
      <el-col :span="4" :style="'color: ' + (pickIndex === 5 ? '#5daf34' : '')">{{ getItems(5) }}</el-col>
      <el-col :span="16" :style="'color: ' + (pickIndex === 4 ? '#5daf34' : '')">{{ getItems(4) }}</el-col>
      <el-col :span="4" :style="'color: ' + (pickIndex === 3 ? '#5daf34' : '')">{{ getItems(3) }}</el-col>
    </el-row>
    <br>
    <i class="el-icon-time"/>
    <el-select v-model="canvasTime" placeholder="识别速度" style="width: 80px">
      <el-option label="即时" :value="0"/>
      <el-option label="快" :value="500"/>
      <el-option label="中" :value="1000"/>
      <el-option label="慢" :value="2000"/>
      <el-option label="无" :value="-1"/>
    </el-select>
    <el-button v-show="canvasTime===-1" @click="move" icon="el-icon-position" />
    <el-button @click="init" icon="el-icon-refresh-right" />
    <el-button @click="handleSwitchManageMode" :icon="manageMode ? 'el-icon-finished' : 'el-icon-setting'" />
    <h3>快捷轮盘</h3>
    <p>朝8个方向滑动来打开app</p>
    
    <el-alert v-if="getUrlParams('dev') === '1'">
      <br>indexStack:{{indexStack}}<br>curBoard:{{curBoard}}<br>useBoard:{{useBoard}}<br>schemeBoard:{{schemeBoard}}
    </el-alert>

    <el-dialog title="管理" :visible.sync="dialogManageSchemeVisible" @close="pickBoard = curBoard">
      <el-form ref="form" style="text-align: left;">
        <el-button icon="el-icon-refresh" @click="handleSwitchItem"> {{pickBoard.type === 'app' ? 'app' : 'app组'}}</el-button>
        <el-form-item label="名称">
          <el-input v-model="pickBoard.name" />
        </el-form-item>
        <el-form-item v-show="pickBoard.type==='app'" label="Scheme">
          <el-input v-model="pickBoard.scheme" />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import {getIndex} from '../utils/borad'
  export default {
    name: "Board",
    data() {
      return {
        width: document.documentElement.clientWidth * 0.6,
        height: document.documentElement.clientHeight * 0.4,
        canvasTime: 500,
        schemeBoard: JSON.parse(localStorage.getItem('schemeBoard')),
        dialogManageSchemeVisible: false,
        manageMode: false,
        moveRecorder: {x1: 0, x2: 0, y1: 0, y2: 0},
        curBoard: null,
        prepIndex: undefined,
        pickBoard: null,
        pickIndex: null,
        indexStack: [],
        canvas:null,
        ctx:null
      }
    },
    created() {
      if (!this.schemeBoard) {
        this.schemeBoard = {type: 'group', name: '面板', children: []};
        for (let i = 0; i < 8; i++) {
          this.schemeBoard.children.push({type: 'app', name: '✕'});
        }
        this.schemeBoard.children[0] = {type: 'app', name: '微信', scheme: 'weixin://'};
        this.schemeBoard.children[1] = {type: 'app', name: '淘宝', scheme: 'taobao://'};
      }
      this.curBoard = this.schemeBoard;
      this.pickBoard = this.schemeBoard;
    },
    mounted() {
      this.show();
      window.onresize = function windowResize () {
        this.width = document.documentElement.clientWidth * 0.6;
        this.height = document.documentElement.clientHeight * 0.4;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
      }
    },
    methods:{
      // 显示canvas画布
      show(){
        this.canvas = this.$refs.canvas;//指定canvas
        this.ctx = this.canvas.getContext("2d");//设置2D渲染区域
        this.ctx.lineWidth = 3;//设置线的宽度
        this.ctx.rect(0, 0, this.width, this.height);
        this.ctx.fillStyle="white";
        this.ctx.fill();
      },
      // 按下鼠标触发
      canvasDown(e) {
        console.log("触发mousedown");
        this.canvasMoveUse = true;
        this.startTime = Date.now();
        const canvasX = e.clientX - e.target.offsetLeft;
        const canvasY = e.clientY - e.target.offsetTop + document.documentElement.scrollTop;
        this.moveRecorder.x1 = canvasX;
        this.moveRecorder.y1 = canvasY;
      },
      // 移动鼠标触发
      canvasMove(e) {
        console.log("触发mouseover");
        if (this.canvasMoveUse) {
          const canvasX = e.clientX - e.target.offsetLeft;
          const canvasY = e.clientY - e.target.offsetTop + document.documentElement.scrollTop;
          this.canvasMoveUse = false;
          this.move(canvasX, canvasY);
          this.canvasMoveUse = true;
        }
      },
      // 触发touchdown
      touchDown(e) {
        console.log("触发touchDown")
        this.canvasMoveUse = true;
        this.startTime = Date.now();
        const canvasX = e.changedTouches[0].clientX - e.target.offsetLeft;
        const canvasY = e.changedTouches[0].clientY - e.target.offsetTop + document.documentElement.scrollTop;
        this.moveRecorder.x1 = canvasX;
        this.moveRecorder.y1 = canvasY;
      },
      touchMove(e) {
        if (this.canvasMoveUse) {
          const canvasX = e.changedTouches[0].clientX - e.target.offsetLeft;
          const canvasY = e.changedTouches[0].clientY - e.target.offsetTop + document.documentElement.scrollTop;
          this.canvasMoveUse = false;
          this.move(canvasX, canvasY);
          this.canvasMoveUse = true;
        }
      },
      canvasLeave() {
        if (!this.canvasMoveUse) {
          return;
        }
        this.pickIndex = null;
        this.canvasMoveUse = false;
        this.startTime = Date.now();
        setTimeout(() =>{
          const endTime = Date.now();
          if (this.canvasTime !== -1 && endTime - this.startTime >= this.canvasTime) {
            this.open();
          }
        },this.canvasTime);
      },
      // 根据按下鼠标时的位置和当前移动的位置，判断当前的手势方向。
      move(canvasX=null, canvasY=null) {
        if (canvasX !== null && canvasY !== null) {
          this.moveRecorder.x2 = canvasX;
          this.moveRecorder.y2 = canvasY;
        }
        // 获取当前指向的app
        const index = getIndex(this.moveRecorder);
        if (index !== null) {
          this.pickIndex = index;
        }
        // 如果上次指向的app和本次不同？
        if (index !== null && this.prepIndex !== index) {
          // console.log(index);
          this.moveRecorder.x1 = canvasX;
          this.moveRecorder.y1 = canvasY;
          // 如果上一次指向的不是undefined且上次指向的和本次指向的序号相差不为4？
          if (this.prepIndex !== undefined && Math.abs(this.prepIndex - index) === 4) {
            // 后退，设置当前的挑选幕布为curBoard？
            this.back();
            this.pickBoard = this.curBoard;
          }else if (this.curBoard.type === 'group' && this.curBoard.children[index] !== undefined) {
            this.pickBoard = this.curBoard.children[index];
            if (this.pickBoard.type === 'app') {
              return;
            }
            this.indexStack.push(index);
            this.curBoard = this.curBoard.children[index];
            this.prepIndex = index;
          }
        }
      },
      open() {
        if (this.manageMode && this.pickBoard !== this.schemeBoard) {
          this.dialogManageSchemeVisible = true;
        } else {
          if( this.pickBoard.type === 'app' && this.pickBoard.scheme !== undefined) {
            this.handleJump(this.pickBoard.scheme);
          }
        }
      },
      // 处理跳转
      handleJump(url, param={}) {
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
            this.$message.warning({message: "取消跳转后可能需要刷新", duration: 1000})
          }, 2000);
        } else {
          window.location.href = url;
        }
      },
      // 处理切换方式
      handleSwitchItem() {
        if (this.pickBoard.type === 'group') {
          this.pickBoard.type = 'app';
          this.pickBoard.name = '✕';
          this.pickBoard.children = undefined;
          if(this.curBoard === this.pickBoard) {
            this.back();
          }
        } else if (this.pickBoard.type === 'app') {
          this.pickBoard.type = 'group';
          this.pickBoard.name = 'app组';
          this.pickBoard.children = [];
          for (let i = 0; i < 8; i++) {
            this.pickBoard.children.push({type: 'app', name: '✕'});
          }
        }
      },
      // 切换管理模式
      handleSwitchManageMode() {
        // 如果当前是管理模式，需要将当前内容保存
        if (this.manageMode) {
          localStorage.setItem('schemeBoard', JSON.stringify(this.schemeBoard));
          this.$message.success({message: "保存成功", duration: 1000})
        }
        // 切换模式
        this.manageMode = !this.manageMode;
      },
      getUrlParams(key) {
        const query = window.location.search.substring(1);
        const vars = query.split("&");
        for (let i=0; i<vars.length; i++) {
          const pair = vars[i].split("=");
          if(pair[0] === key){
            return pair[1];
          }
        }
        return false;
      },
      getItems(index) {
        if (this.prepIndex === index) {
          return '终点'
        }
        if (this.prepIndex !== undefined && Math.abs(this.prepIndex - index) === 4) {
          return '返回';
        }
        if (this.curBoard.type === 'app') {
          return '✕';
        } else if (this.curBoard.type === 'group') {
          return this.curBoard.children[index].name;
        }
      },
      back() {
        this.indexStack.pop();
        let tmpBoard = this.schemeBoard;
        for(const i in this.indexStack) {
          tmpBoard = tmpBoard.children[this.indexStack[i]];
        }
        this.curBoard = tmpBoard;
        this.prepIndex = this.indexStack.slice(-1)[0];
      },
      init() {
        this.prepIndex = undefined;
        this.indexStack = [];
        this.curBoard = this.schemeBoard;
        this.pickBoard = this.schemeBoard;
      }
    }
  }
</script>

<style scoped>
</style>