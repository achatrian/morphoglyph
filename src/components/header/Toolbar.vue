<template lang="html">
   <!--app property allows to keep toolbar fixed -->
  <v-toolbar
    fixed
    app
    dense
    clipped-right
    clipped-left
    class="light"
  >
    <div id="toolbar-toggle">
      <v-toolbar-side-icon left @click="onToolsClick">
        <v-icon color="deep-purple">menu</v-icon>
      </v-toolbar-side-icon>
    </div>
    <v-toolbar-title router to='/'
                     class="deep-purple--text font-weight-black"
                     id="toolbar-title">
      PheW
    </v-toolbar-title>
    <app-load-data/>
    <div id="file-name">
      <span style="">{{fileName}}</span>
    </div>
    <!--because of flex, elements must be at either end or beginning, or they will change position if something is inserted on the right (e.g. the file name)-->
    <v-spacer/>
    <app-box-toggler/>
    <app-zoomer/>
    <!--<v-divider vertical/>-->
    <app-view-manager/>
    <v-toolbar-side-icon @click="onStudioClick">
      <v-icon color="deep-purple">menu</v-icon>
    </v-toolbar-side-icon>
  </v-toolbar>
</template>

<script>
import {mapState, mapActions} from 'vuex'

//import Settings from './settings/Settings'
import LoadData from './buttons/LoadData'
import ViewManager from './buttons/ViewManager'
import Zoomer from './buttons/Zoomer'
import BoxToggler from './buttons/BoxToggler'

export default {
  name: 'Toolbar',
  components: {
    //'app-settings': Settings,
    'app-load-data': LoadData, // TODO v-file-input not working in toolbar at time of writing? Wait until it is released in stable version?
    'app-view-manager': ViewManager,
    'app-zoomer': Zoomer,
    'app-box-toggler': BoxToggler
  },
  computed: {
    ...mapState({
      fileName: state => state.backend.fileName,
      numDisplayedGlyphs: state => state.glyph.numDisplayedGlyphs
    })
  },
  methods: {
    ...mapActions({
      toggleToolsDrawer: 'app/toggleToolsDrawer',
      toggleStudioDrawer: 'app/toggleStudioDrawer'//,
      //loadFeaturesFile: 'backend/loadFeaturesFile',
    }),
    onToolsClick () {
      this.toggleToolsDrawer()
    },
    onStudioClick () {
      this.toggleStudioDrawer()
    }
  }
}
</script>
<!-- TODO use deep selector to change all icons to purple -->
<style lang='css' scoped>
  #toolbar-side-icon-spacer {
    height: 36px;
    width: 36px;
  }

  #file-name {
    background-color: #FAFAFA;
    color: #673AB7;
    display: inline-block
  }

  #toolbar-title {
    margin-left: -10px
  }

  #toolbar-toggle {
    margin-left: -30px;
    margin-right: 40px;
  }
</style>
