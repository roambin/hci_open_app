<template>
    <div id="app">
        <Board v-if="mode === 'Board'" />
        <Draw v-if="mode === 'Draw'" />
        <Word v-if="mode === 'Word'" />
        <el-button-group>
            <el-button :type="mode === 'Board' ? 'primary' : ''" @click="mode = 'Board'">面板</el-button>
            <el-button :type="mode === 'Word' ? 'primary' : ''" @click="mode = 'Word'">字母</el-button>
            <el-button :type="mode === 'Draw' ? 'primary' : ''" @click="mode = 'Draw'">画板</el-button>
        </el-button-group>
    </div>
</template>

<script>
import Draw from './components/Draw.vue'
import Board from "./components/Board.vue";
import Word from './components/Word.vue';

export default {
    name: 'App',
    components: {
        Board,
        Draw,
        Word
    },
    data() {
        return {
            mode: 'Board'
        }
    },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
