<template>
  <div id="container">
    <app-snackbar/>
    <app-toolbar v-if="this.toolbar"/>
    <app-tools/>
    <app-view/>
    <app-studio/>
<!--    <app-lower-toolbar v-if="this.footer"/>-->
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import Toolbar from '../header/Toolbar'
import Tools from './tools/Tools'
import View from './view/View'
import Studio from './studio/Studio'
// import LowerToolbar from '../footer/LowerToolbar'
import Snackbar from '../notification/Snackbar.vue'

export default {
  name: 'Editor',
  components: {
    'app-toolbar': Toolbar,
    'app-tools': Tools,
    'app-view': View,
    'app-studio': Studio,
    // 'app-lower-toolbar': LowerToolbar,
    'app-snackbar': Snackbar
  },
  computed: {
    ...mapState({
      toolbar: state => state.app.toolbar,
      footer: state => state.app.footer,
      toolsDrawer: state => state.app.toolsDrawer
    })
  },
  methods: {
    ...mapActions({
      getArrayOfTemplates: 'template/getArrayOfTemplates'
    })
  },
  mounted () {
    console.log("loading array of templates ...")
    this.getArrayOfTemplates() // call here to have available templates ready
  }
}
</script>

<style scoped>
  #container {
    display: flex;
    flex-flow: column;
    height: 100%;
  }
</style>
