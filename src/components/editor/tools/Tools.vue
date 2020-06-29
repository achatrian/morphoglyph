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
      <app-bind :color="glyphBinder? 'primary' : 'white'"/>
      <app-shape :color="shapeManager? 'primary' : 'white'"/>
      <app-child :color="glyphAdder? 'primary' : 'white'"/>
      <app-template :color="templateManager? 'primary' : 'white'"/>
      <app-remove/>
      <!--<app-chart/>-->
      <!--<app-legend/>-->
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import Bind from './Bind'
import Shape from './Shape'
import Child from './Child'
import Remove from './Remove'
import Template from './Template'
// import Chart from './Chart'
// import Legend from './Legend'

export default {
  name: 'Tools',
  components: {
    'app-bind': Bind,
    'app-shape': Shape,
    'app-child': Child,
    'app-remove': Remove,
    'app-template': Template
    // 'app-chart': Chart,
    // 'app-legend': Legend
  },
  computed: {
    ...mapState({
      toolsDrawer: state => state.app.toolsDrawer,
      glyphBinder: state => state.app.glyphBinder,
      shapeManager: state => state.app.shapeManager,
      glyphAdder: state => state.app.glyphAdder,
      templateManager: state => state.app.templateManager
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
