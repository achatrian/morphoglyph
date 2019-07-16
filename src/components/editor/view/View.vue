<template>
  <div id="view">
    <app-welcome-card id="welcome-card" v-if="welcomeCard" @configLoaded="applyBinding"/>
    <app-bind-options id="element-binder" v-show="glyphBinder" ref="bonds"/>
    <v-container v-show="!glyphBinder"
      id="card-container" fluid grid-list-md>
    </v-container>
    <app-glyph-canvas v-resize.quiet="updateGrid"
                      v-show="canvas" ref="canvas"
    />
    <!--since canvas has z-index=1, it was on top of view card, which made clicking on buttons impossible-->
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import GlyphCanvas from './GlyphCanvas'
import BindOptions from './BindOptions'
import WelcomeCard from './WelcomeCard'

export default {
  name: 'UIView', // prevent warning for reused HTML id
  data () {
    return {
      boundingRects: [],
      page: 1
    }
  },
  components: {
    'app-glyph-canvas': GlyphCanvas,
    'app-bind-options': BindOptions,
    'app-welcome-card': WelcomeCard
  },
  computed: {
    ...mapState({
      welcomeCard: state => state.app.welcomeCard,
      glyphBinder: state => state.app.glyphBinder,
      canvas: state => state.app.canvas
    })
  },
  methods: {
    ...mapActions({
      changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
      updateGrid: 'app/updateGrid'
    }),
    applyBinding () { // apply configuration in BindOptions, then load bindings onto store
      this.$refs.bonds.applyConfig()
      this.$refs.bonds.applyBinding()
    }
  },
  mounted () {
    this.updateGrid()
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

  #element-binder{
    display: flex;
    flex: 1 1 auto;
    z-index: 3;
    margin: 5px 5px 5px 5px;
  }

  #card-container{
    display: flex;
    align-items: stretch;
    flex: 1 1 auto;
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 1
  }

  #view{
    position: relative;
    display: flex;
    flex: 1 1 auto;
    margin: 0px 5px 5px 5px;
  }
</style>
