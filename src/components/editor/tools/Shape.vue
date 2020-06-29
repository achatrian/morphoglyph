<template>
  <v-list-tile id="tool-tile">
    <v-tooltip
      id="tooltip"
      right
      open-delay="700"
    >
      <v-btn
        id="glyph"
        slot="activator"
        flat
        block
        :color="color"
        @click="setShapeManagerState(!shapeManager)"
      >
        <v-icon light :color="color">adjust</v-icon>
        <!--TODO install shape icon-->
      </v-btn>
      <span> Draw shapes for use in glyphs </span>
    </v-tooltip>
  </v-list-tile>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
  name: 'Shape',
  props: {
    color: {type: String, default: 'white'}
  },
  computed: {
    ...mapState({
      shapeManager: state => state.app.shapeManager
    })
  },
  methods: {
    ...mapActions({
      setShapeManagerState: 'app/setShapeManagerState'
    })
  }
}
</script>

<style scoped>
  #tooltip {
    width: 100%;
  }

  #glyph {
    min-width: 0px;
  }

  #tool-tile {
    padding: 0px;
  }
</style>
