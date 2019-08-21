<template>
  <v-navigation-drawer
    id="tools-drawer"
    fixed
    clipped
    @input="updateToolsDrawerState"
    :value="this.toolsDrawer"
    mini-variant
    mini-variant-width="60"
    app
    mobile-break-point="800"
    class="dark"
  >
    <!--NB drawer doesn't have colour attribute, only light/dark ??-->
    <!--v-if="['loading'].indexOf($route.name) === -1"-->
    <v-list>
      <app-bind/>
      <app-add-child/>
      <app-remove/>
      <app-chart/>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import Bind from './Bind'
import AddChild from './AddChild'
import Remove from './Remove'
import Chart from './Chart'

export default {
  name: 'Tools',
  components: {
    'app-bind': Bind,
    'app-add-child': AddChild,
    'app-remove': Remove,
    'app-chart': Chart
  },
  computed: {
    ...mapState({
      toolsDrawer: state => state.app.toolsDrawer
    })
  },
  methods: {
    ...mapActions({
      setToolsDrawerState: 'app/setToolsDrawerState'
    }),
    updateToolsDrawerState (state) {
      if (!state) {
        this.setToolsDrawerState(state)
      }
    }
  }
}
</script>

<style scoped>

</style>
