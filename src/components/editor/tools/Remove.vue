<template lang="html">
  <v-list-tile id="tool-tile">
    <v-tooltip
      id="tooltip"
      right
      open-delay="700"
    >
      <v-btn
        id="remove"
        slot="activator"
        flat
        block
        @click="onClick">
        <v-icon light color="white">close</v-icon>
      </v-btn>
      <span> Remove glyphs </span>
    </v-tooltip>
  </v-list-tile>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
  name: 'Remove',
  computed: {
    ...mapState({
      parsedData: state => state.backend.parsedData,
      glyphs: state => state.glyph.project.glyphs
    })
  },
  methods: {
    ...mapActions({
      resetLayers: 'glyph/resetLayers',
      changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
      setGlyphArrangement: 'app/setGlyphArrangement'
    }),
    onClick () {
      this.resetLayers()
      this.changeDisplayedGlyphNum(0)
      this.setGlyphArrangement('grid') // reset glyph arrangement to default grid
    }
  }
}
</script>

<style lang='css' scoped>
  #tooltip {
    width: 100%;
  }

  #remove {
    min-width: 0px;
  }

  #tool-tile {
    padding: 0px;
  }
</style>
