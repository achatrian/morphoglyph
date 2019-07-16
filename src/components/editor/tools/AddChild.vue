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
        @click="setGlyphBinderState(true)">
        <v-icon light :color="color">add</v-icon>
      </v-btn>
      <span> Add glyph to existing drawing </span>
    </v-tooltip>
  </v-list-tile>
</template>

<script>
import {mapActions} from 'vuex'

export default {
  name: 'addChild',
  methods: {...mapActions({
    addChildGlyph: 'glyph/addChildGlyph'
  })},
  props: {
    color: {type: String, default: 'white'}
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
