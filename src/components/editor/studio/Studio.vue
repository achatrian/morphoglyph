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
    <app-viz-props/>
  </div>
  </v-navigation-drawer>
  <!--v-if="['loading', 'landing', 'examples'].indexOf($route.name) === -1"-->
</template>

<script>
import { mapState, mapActions } from 'vuex'
//import Table from './Table'
import VizProps from './VizProps'
// import GlyphBind from './GlyphBind'

export default {
  name: 'Studio',
  components: {
    //'app-table': Table,
    'app-viz-props': VizProps
  },
  computed: {
    ...mapState({
      studioDrawer: state => state.app.studioDrawer
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
    overflow: auto;
  }
</style>
