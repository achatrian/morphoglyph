<template>
  <div>
    <v-toolbar
      color="dark"
      flat
      dense>
      <v-slider label="x"
                color="secondary"
                v-model="selectedRelativeX"
                min=0
                max=1
                step=0.05
                style="margin-left:-10px"
                @change="updatePosition"
      />
      <v-slider label="y"
                color="secondary"
                v-model="selectedRelativeY"
                min=0
                max=1
                step=0.05
                style="margin-left:+10px"
                @change="updatePosition"
      />
    </v-toolbar>
    <v-toolbar
      color="dark"
      flat
      dense>
      <v-slider label="w"
                color="secondary"
                v-model="selectedRelativeW"
                min=0
                max=1
                step=0.05
                style="margin-left:-10px"
                @change="updatePosition"
      />
      <v-slider label="h"
                color="secondary"
                v-model="selectedRelativeH"
                min=0
                max=1
                step=0.05
                style="margin-left:+10px"
                @change="updatePosition"
      />
    </v-toolbar>
  </div>
</template>

<script>
import {mapActions} from 'vuex'

export default {
  name: 'Positioner',
  props: {
    shapeName: String
  },
  data () {
    return {
      selectedRelativeX: 0.5,
      selectedRelativeY: 0.5,
      selectedRelativeW: 0.5,
      selectedRelativeH: 0.5
    }
  },
  methods: {
    ...mapActions({
      setShapePosition: 'glyph/setShapePosition'
    }),
    updatePosition () {
      const position = {
        topShift: this.selectedRelativeY,
        leftShift: this.selectedRelativeX,
        widthProportion: this.selectedRelativeW,
        heightProportion: this.selectedRelativeH
      }
      this.setShapePosition({
        shapeName: this.shapeName,
        position: position
      })
    }
  }
}
</script>

<style scoped>

</style>
