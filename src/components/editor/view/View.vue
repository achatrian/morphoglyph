<template>
  <div id="view">
    <app-welcome-card id="welcome-card" v-if="welcomeCard && !drawing" @configLoaded="applyBinding"/>
    <app-bind-options class="control-panel" v-show="glyphBinder" ref="bonds"/>
    <app-shape-manager v-if="shapeManager"/>
    <app-glyph-adder v-if="glyphAdder"/>
    <app-glyph-canvas v-resize.quiet="updateGlyphArrangement" :drawing.sync="drawing"
                      v-show="canvas" ref="canvas"/>
    <app-legend-viewer v-if="legendViewer"/>
    <app-shape-canvas v-if="shapeCanvas"/>
    <app-template-manager v-if="templateManager"/>
    <div class="progress-wrap" v-show="drawing && !glyphBinder && !shapeManager && !glyphAdder && !legendViewer && !templateManager">
      <v-progress-circular class="progress" indeterminate size="100" color="primary"/>
    </div>
    <!--since canvas has z-index=1, it was on top of view card, which made clicking on buttons impossible-->
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import GlyphCanvas from './GlyphCanvas'
import BindOptions from './BindOptions'
import ShapeManager from './ShapeManager'
import GlyphAdder from './GlyphPreview'
import WelcomeCard from './WelcomeCard'
import LegendViewer from "./LegendViewer"
import ShapeCanvas from "./ShapeCanvas"
import TemplateManager from "./TemplateManager"

export default {
  name: 'UIView', // prevent warning for reused HTML id
  data () {
    return {
      boundingRects: [],
      page: 1,
      drawing: false
    }
  },
  components: {
    'app-glyph-canvas': GlyphCanvas,
    'app-bind-options': BindOptions,
    'app-shape-manager': ShapeManager,
    'app-glyph-adder': GlyphAdder,
    'app-legend-viewer': LegendViewer,
    'app-welcome-card': WelcomeCard,
    'app-shape-canvas': ShapeCanvas,
    'app-template-manager': TemplateManager
  },
  computed: {
    ...mapState({
      welcomeCard: state => state.app.welcomeCard,
      glyphBinder: state => state.app.glyphBinder,
      shapeManager: state => state.app.shapeManager,
      glyphAdder: state => state.app.glyphAdder,
      canvas: state => state.app.canvas,
      legendViewer: state => state.app.legendViewer,
      shapeCanvas: state => state.app.shapeCanvas,
      templateManager: state => state.app.templateManager,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      progressCircle: state => state.app.progressCircle
    })
  },
  methods: {
    ...mapActions({
      updateGlyphArrangement: 'app/updateGlyphArrangement'
    }),
    applyBinding () { // apply configuration in BindOptions, then load bindings onto store
      this.$refs.bonds.applyConfig()
      this.$refs.bonds.applyBinding()
    }
  },
  watch: {
    progressCircle () {
      this.drawing = this.progressCircle
    }
  },
  mounted () {
    this.updateGlyphArrangement()
  }
}
</script>

<style scoped>
  #welcome-card{
    z-index: 3;
    height: 20%;
    width: 50%;
    margin: auto auto
  }

  .control-panel{
    display: flex;
    flex: 1 1 auto;
    z-index: 3;
    margin: 5px 5px 5px 5px;
  }

  .progress-wrap{
    position: relative;
    height: 100%;
    width: 100%
  }

  .progress{
    left: 45%;
    top: 45%;
    margin: auto
  }

  #view{
    display: flex;
    flex: 1 1 auto;
    margin: 0px 5px 5px 5px;
  }
</style>
