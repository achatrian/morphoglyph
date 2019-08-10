<template>
  <div id="view">
    <app-welcome-card id="welcome-card" v-if="welcomeCard" @configLoaded="applyBinding"/>
    <app-bind-options class="control-panel" v-show="glyphBinder" ref="bonds"/>
    <app-glyph-adder v-if="glyphAdder"/>
    <app-glyph-canvas v-resize.quiet="updateGlyphArrangement" :drawing.sync="drawing"
                      v-show="canvas" ref="canvas"/>
    <div class="progress-wrap" v-show="drawing && !glyphBinder && !glyphAdder">
      <v-progress-circular class="progress" indeterminate size="100" color="primary"/>
    </div>
    <!--since canvas has z-index=1, it was on top of view card, which made clicking on buttons impossible-->
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import GlyphCanvas from './GlyphCanvas'
import BindOptions from './BindOptions'
import GlyphAdder from './GlyphAdder'
import WelcomeCard from './WelcomeCard'

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
    'app-glyph-adder': GlyphAdder,
    'app-welcome-card': WelcomeCard
  },
  computed: {
    ...mapState({
      welcomeCard: state => state.app.welcomeCard,
      glyphBinder: state => state.app.glyphBinder,
      glyphAdder: state => state.app.glyphAdder,
      canvas: state => state.app.canvas,
      numDisplayedGlyphs: state=>state.app.numDisplayedGlyphs
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
