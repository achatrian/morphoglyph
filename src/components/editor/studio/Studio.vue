// Studio.vue
// Component defines the studio; the interaction elements on the right side of
// the app.
<template>
  <v-navigation-drawer
    id="studio-drawer"
    fixed
    clipped
    @input="updateStudioDrawerState"
    :value="this.studioDrawer"
    app
    right
    mobile-break-point="1000"
    dark
  >
  <div class="pointers-please studioPanel elevation-1">
    <!--studio applets go in here-->
    <!--turning off viz props when binder is showing (as multiple binding UIs would be confusing)-->
    <app-glyph-adder v-show="glyphs.length === 0"/>
    <app-viz-props v-show="glyphs.length > 0" :shapeName.sync="shapeName"/>
<!--    <app-positioner v-show="glyphs.length > 0" :shape-name="shapeName"/>-->
    <app-chart-controller v-show="glyphs.length > 0"/>
    <!--<app-shape-canvas/>-->
  </div>
  </v-navigation-drawer>
  <!--v-if="['loading', 'landing', 'examples'].indexOf($route.name) === -1"-->
</template>

<script>
import {mapState, mapActions} from 'vuex'
// import Table from './Table'
import VizProps from './VizProps'
// import Positioner from './Positioner'
// import ShapeCanvas from './ShapeCanvas'
import ChartController from './ChartController'
import GlyphAdder from './GlyphAdder'


export default {
  name: 'Studio',
  data () {
    return {
      shapeName: '' // shape name to pass from viz-props into positioner
    }
  },
  components: {
    // 'app-table': Table,
    'app-viz-props': VizProps,
    // 'app-positioner': Positioner,
    // 'app-shape-canvas': ShapeCanvas,
    'app-chart-controller': ChartController,
    'app-glyph-adder': GlyphAdder
  },
  computed: {
    ...mapState({
      glyphs: state => state.glyph.project.glyphs,
      studioDrawer: state => state.app.studioDrawer,
    })
  },
  methods: {
    ...mapActions({
      setStudioDrawerState: 'app/setStudioDrawerState'
    }),
    updateStudioDrawerState (state) {
      if (!state) {
        this.setStudioDrawerState(state)
      }
    }
  }
}
</script>
<style lang='css' scoped>
  .studioPanel {
    /*background: #EDE7F6;*/
    height: 100%;
    overflow: auto;
  }
</style>
