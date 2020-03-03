<template>
  <div id="app">
    <Draw />
    <Introduction />
  </div>
</template>

<script>
import Draw from './components/Draw.vue'
import Introduction from './components/Introduction.vue'

export default {
  name: 'App',
  components: {
    Draw,
    Introduction
  }
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
